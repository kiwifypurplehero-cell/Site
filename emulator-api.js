import {EMULATORS, findEmulator} from './emulator-registry.js';

const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';
const SAFE_SLUG = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const DEFAULT_PREFIX = 'ps2/jogos/';
const PS1_DEFAULTS = Object.freeze({
  endpoint: 'https://s3.us-east-005.backblazeb2.com',
  bucket: 'plumpgames-storage-ps1',
  prefix: 'Jogos/'
});
const encoder = new TextEncoder();

class B2Error extends Error {
  constructor(kind, status, code, message) {
    super(message);
    this.kind = kind;
    this.status = status;
    this.code = code;
  }
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {status, headers: {'Content-Type': 'application/json; charset=utf-8', ...headers}});
}

function titleFromSlug(slug) {
  return slug.split('-').map(word => word ? word[0].toUpperCase() + word.slice(1) : '').join(' ');
}

function hex(bytes) {
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(value) {
  return crypto.subtle.digest('SHA-256', typeof value === 'string' ? encoder.encode(value) : value);
}

async function hmac(key, value) {
  const cryptoKey = await crypto.subtle.importKey('raw', key, {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(value));
}

function encodePath(path) {
  return path.split('/').map(part => encodeURIComponent(part)).join('/');
}

function b2Config(env, emulatorId) {
  if (emulatorId === 'ps1') return {
    endpoint: env.B2_PS1_ENDPOINT || PS1_DEFAULTS.endpoint,
    bucket: env.B2_PS1_BUCKET || PS1_DEFAULTS.bucket,
    prefix: env.B2_PS1_PREFIX || PS1_DEFAULTS.prefix,
    accessKeyId: env.B2_PS1_ACCESS_KEY_ID,
    secretAccessKey: env.B2_PS1_SECRET_ACCESS_KEY
  };
  return {endpoint: env.B2_ENDPOINT, bucket: env.B2_BUCKET, prefix: env.B2_PS2_PREFIX || DEFAULT_PREFIX, accessKeyId: env.B2_ACCESS_KEY_ID, secretAccessKey: env.B2_SECRET_ACCESS_KEY};
}

async function signedB2Fetch(config, method, key = '', query = '', requestHeaders = {}) {
  const endpoint = new URL(config.endpoint);
  const regionMatch = endpoint.hostname.match(/^s3\.([^.]+)\.backblazeb2\.com$/);
  const region = regionMatch?.[1];
  if (!region || !config.bucket || !config.accessKeyId || !config.secretAccessKey) throw new Error('Backblaze B2 não configurado.');

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = amzDate.slice(0, 8);
  const pathname = `/${encodeURIComponent(config.bucket)}/${encodePath(key)}`;
  const url = new URL(pathname + (query ? `?${query}` : ''), endpoint);
  const headers = new Headers(requestHeaders);
  headers.set('host', endpoint.host);
  headers.set('x-amz-content-sha256', 'UNSIGNED-PAYLOAD');
  headers.set('x-amz-date', amzDate);
  const signedHeaderNames = [...headers.keys()].map(name => name.toLowerCase()).sort();
  const canonicalHeaders = signedHeaderNames.map(name => `${name}:${headers.get(name).trim()}\n`).join('');
  const canonicalRequest = [method, pathname, query, canonicalHeaders, signedHeaderNames.join(';'), 'UNSIGNED-PAYLOAD'].join('\n');
  const scope = `${date}/${region}/s3/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, hex(await sha256(canonicalRequest))].join('\n');
  const dateKey = await hmac(encoder.encode(`AWS4${config.secretAccessKey}`), date);
  const regionKey = await hmac(dateKey, region);
  const serviceKey = await hmac(regionKey, 's3');
  const signingKey = await hmac(serviceKey, 'aws4_request');
  const signature = hex(await hmac(signingKey, stringToSign));
  headers.set('Authorization', `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaderNames.join(';')}, Signature=${signature}`);
  headers.delete('host');
  return fetch(url, {method, headers});
}

function decodeXml(value) {
  return value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

async function b2Failure(response) {
  const body = await response.text();
  const code = decodeXml(body.match(/<Code>([^<]*)<\/Code>/)?.[1] || 'UnknownError');
  const message = decodeXml(body.match(/<Message>([^<]*)<\/Message>/)?.[1] || `HTTP ${response.status}`);
  const kind = response.status === 401 || response.status === 403
    ? (code === 'InvalidAccessKeyId' || code === 'SignatureDoesNotMatch' ? 'invalid_credentials' : 'bucket_inaccessible')
    : 'bucket_inaccessible';
  console.error('[PS1-B2] error', {status: response.status, code, message});
  return new B2Error(kind, response.status, code, message);
}

async function listGames(env, emulator) {
  const config = b2Config(env, emulator.id);
  const prefix = config.prefix;
  if (emulator.id === 'ps1') return listPs1Games(config, emulator);
  const query = new URLSearchParams({'list-type': '2', prefix}).toString();
  const response = await signedB2Fetch(config, 'GET', '', query);
  if (!response.ok) throw new Error(`Backblaze B2 respondeu ${response.status}.`);
  const xml = await response.text();
  const games = new Map();
  for (const content of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
    const key = decodeXml(content[1].match(/<Key>([\s\S]*?)<\/Key>/)?.[1] || '');
    const size = Number(content[1].match(/<Size>(\d+)<\/Size>/)?.[1] || 0);
    const updatedAt = content[1].match(/<LastModified>([^<]+)<\/LastModified>/)?.[1] || null;
    const relative = key.slice(prefix.length);
    const match = relative.match(/^([^/]+)\/game\.([a-z0-9]+)$/i);
    if (!key.startsWith(prefix) || !match || !SAFE_SLUG.test(match[1]) || !emulator.romExtensions.includes(match[2].toLowerCase())) continue;
    if (!games.has(match[1])) games.set(match[1], {slug: match[1], title: titleFromSlug(match[1]), format: match[2].toUpperCase(), size, updatedAt});
  }
  return [...games.values()].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
}

function friendlyName(filename) {
  return filename.replace(/\.[^.]+$/, '').replace(/[._]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function validPs1Key(key, prefix, extensions) {
  if (!key.startsWith(prefix) || key === prefix) return false;
  const relative = key.slice(prefix.length);
  const parts = relative.split('/');
  if (parts.some(part => !part || part.startsWith('.') || part.endsWith('~') || /\.(?:tmp|part|crdownload)$/i.test(part))) return false;
  return extensions.includes(relative.split('.').pop()?.toLowerCase());
}

async function listPs1Games(config, emulator) {
  console.log('[PS1-B2] listing bucket');
  console.log(`[PS1-B2] bucket=${config.bucket}`);
  console.log(`[PS1-B2] prefix=${config.prefix}`);
  const games = [];
  let continuationToken = '';
  do {
    const params = new URLSearchParams({'list-type': '2', prefix: config.prefix});
    if (continuationToken) params.set('continuation-token', continuationToken);
    const response = await signedB2Fetch(config, 'GET', '', params.toString());
    if (!response.ok) throw await b2Failure(response);
    const xml = await response.text();
    for (const content of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const key = decodeXml(content[1].match(/<Key>([\s\S]*?)<\/Key>/)?.[1] || '');
      if (!validPs1Key(key, config.prefix, emulator.romExtensions)) continue;
      const filename = key.split('/').pop();
      games.push({key, name: friendlyName(filename), format: filename.split('.').pop().toLowerCase(), size: Number(content[1].match(/<Size>(\d+)<\/Size>/)?.[1] || 0), lastModified: content[1].match(/<LastModified>([^<]+)<\/LastModified>/)?.[1] || null});
    }
    continuationToken = decodeXml(xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/)?.[1] || '');
  } while (continuationToken);
  console.log(`[PS1-B2] result count=${games.length}`);
  if (!games.length) {
    const probeParams = new URLSearchParams({'list-type': '2', 'max-keys': '1'});
    const probe = await signedB2Fetch(config, 'GET', '', probeParams.toString());
    if (!probe.ok) throw await b2Failure(probe);
    const probeXml = await probe.text();
    if (/<Contents>/.test(probeXml)) throw new B2Error('wrong_prefix', 404, 'PrefixNotFound', `Nenhum jogo encontrado no prefixo ${config.prefix}`);
  }
  return games.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

async function findGame(env, emulator, slug) {
  const config = b2Config(env, emulator.id);
  const prefix = config.prefix;
  for (const extension of emulator.romExtensions) {
    const key = `${prefix}${slug}/game.${extension}`;
    const response = await signedB2Fetch(config, 'HEAD', key);
    if (response.ok) return {key, response};
    if (response.status !== 404) throw new Error(`Backblaze B2 respondeu ${response.status}.`);
  }
  return null;
}

function b2Response(response, request) {
  const headers = new Headers(response.headers);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'private, max-age=3600');
  return new Response(request.method === 'HEAD' ? null : response.body, {status: response.status, headers});
}

function hasB2Config(env, emulatorId) {
  const config = b2Config(env, emulatorId);
  return Boolean(config.endpoint && config.bucket && config.accessKeyId && config.secretAccessKey);
}

export async function emulatorApi(request, env, pathname = new URL(request.url).pathname) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return json({error: 'Método não permitido.'}, 405, {Allow: 'GET, HEAD'});
  if (pathname === '/api/emulators') return json({emulators: EMULATORS.map(({romExtensions, coreExtensions, ...item}) => item)}, 200, {'Cache-Control': PUBLIC_CACHE});
  const gamesMatch = pathname.match(/^\/api\/emulators\/([^/]+)\/games$/);
  if (gamesMatch) {
    const emulator = findEmulator(gamesMatch[1]);
    if (!emulator) return json({error: 'Emulador não encontrado.'}, 404);
    if (!hasB2Config(env, emulator.id)) {
      const payload = {error: emulator.id === 'ps1' ? 'Não foi possível acessar a biblioteca PS1.' : 'Biblioteca de jogos não configurada.'};
      if (emulator.id === 'ps1' && String(env.PS1_DIAGNOSTIC_MODE).toLowerCase() === 'true') payload.diagnostic = 'credentials_not_configured';
      return json(payload, 503);
    }
    try { return json({emulator: emulator.id, games: await listGames(env, emulator)}, 200, {'Cache-Control': PUBLIC_CACHE}); }
    catch (error) {
      if (emulator.id !== 'ps1') console.error('B2 listing failure', error);
      const payload = {error: emulator.id === 'ps1' ? 'Não foi possível acessar a biblioteca PS1.' : 'Biblioteca temporariamente indisponível.'};
      if (emulator.id === 'ps1' && String(env.PS1_DIAGNOSTIC_MODE).toLowerCase() === 'true') payload.diagnostic = error.kind || 'request_failed';
      return json(payload, 503);
    }
  }
  const ps1FileMatch = pathname.match(/^\/api\/emulators\/ps1\/file\/(.+)$/);
  if (ps1FileMatch) {
    const emulator = findEmulator('ps1');
    let key;
    try { key = decodeURIComponent(ps1FileMatch[1]); } catch { return json({error: 'Arquivo inválido.'}, 400); }
    const config = b2Config(env, 'ps1');
    if (!hasB2Config(env, 'ps1')) return json({error: 'Biblioteca de jogos não configurada.'}, 503);
    if (!validPs1Key(key, config.prefix, emulator.romExtensions)) return json({error: 'Arquivo não encontrado.'}, 404);
    const headers = request.headers.has('Range') ? {Range: request.headers.get('Range')} : {};
    try {
      const response = await signedB2Fetch(config, request.method, key, '', headers);
      if (response.status === 404) return json({error: 'Arquivo não encontrado.'}, 404);
      return b2Response(response, request);
    } catch (error) { console.error('B2 stream failure', error); return json({error: 'Arquivo temporariamente indisponível.'}, 503); }
  }
  const romMatch = pathname.match(/^\/api\/emulators\/([^/]+)\/games\/([^/]+)\/rom$/);
  if (!romMatch) return null;
  const emulator = findEmulator(romMatch[1]);
  const slug = decodeURIComponent(romMatch[2]).toLowerCase();
  if (!emulator || !SAFE_SLUG.test(slug)) return json({error: 'Jogo não encontrado.'}, 404);
  if (!hasB2Config(env, emulator.id)) return json({error: 'Biblioteca de jogos não configurada.'}, 503);
  const found = await findGame(env, emulator, slug);
  if (!found) return json({error: 'Jogo não encontrado.'}, 404);
  if (request.method === 'HEAD') return b2Response(found.response, request);
  const headers = request.headers.has('Range') ? {Range: request.headers.get('Range')} : {};
  const response = await signedB2Fetch(b2Config(env, emulator.id), 'GET', found.key, '', headers);
  if (response.status === 404) return json({error: 'Jogo não encontrado.'}, 404);
  return b2Response(response, request);
}
