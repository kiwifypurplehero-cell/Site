import {EMULATORS, findEmulator} from './emulator-registry.js';

const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';
const PS1_COVER_CACHE = 'public, max-age=86400, stale-while-revalidate=604800';
const PS1_BOOT_PRIORITY = Object.freeze(['m3u', 'cue', 'chd', 'pbp', 'ccd', 'img', 'iso', 'bin']);
const PS1_BOOT_EXTENSIONS = new Set(PS1_BOOT_PRIORITY);
const PS1_AUX_EXTENSIONS = new Set(['bin', 'ecm', 'sub']);
const PS1_COVER_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const SAFE_SLUG = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const DEFAULT_PREFIX = 'ps2/jogos/';
const PS1_DEFAULTS = Object.freeze({
  endpoint: 'https://s3.us-east-005.backblazeb2.com',
  bucket: 'plumpgames-storage-ps1',
  prefix: 'Jogos/'
});
const encoder = new TextEncoder();
const PS1_BLOCK_SIZE = 4 * 1024 * 1024;
const PS1_BLOCK_TTL = 86400;
const PS1_SIGNED_URL_TTL = 600;
const PS1_MAX_RANGE = 16 * 1024 * 1024;
const ps1RequestHistory = new Map();

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
  return path.split('/').map(awsEncode).join('/');
}

// AWS SigV4 uses RFC 3986 encoding (encodeURIComponent leaves !'()* unescaped).
function awsEncode(value) {
  return encodeURIComponent(String(value)).replace(/[!'()*]/g, character => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function canonicalQuery(parameters = []) {
  return parameters
    .map(([name, value]) => [awsEncode(name), awsEncode(value)])
    .sort(([leftName, leftValue], [rightName, rightValue]) => leftName < rightName ? -1 : leftName > rightName ? 1 : leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0)
    .map(([name, value]) => `${name}=${value}`)
    .join('&');
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

async function signedB2Fetch(config, method, key = '', queryParameters = [], requestHeaders = {}) {
  const endpoint = new URL(config.endpoint);
  const regionMatch = endpoint.hostname.match(/^s3\.([^.]+)\.backblazeb2\.com$/);
  const region = regionMatch?.[1];
  if (!region || !config.bucket || !config.accessKeyId || !config.secretAccessKey) throw new Error('Backblaze B2 não configurado.');

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = amzDate.slice(0, 8);
  const pathname = `/${awsEncode(config.bucket)}/${encodePath(key)}`;
  const query = canonicalQuery(queryParameters);
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

async function presignedB2Url(config, key, expires = PS1_SIGNED_URL_TTL) {
  const endpoint = new URL(config.endpoint);
  const region = endpoint.hostname.match(/^s3\.([^.]+)\.backblazeb2\.com$/)?.[1];
  if (!region || !config.bucket || !config.accessKeyId || !config.secretAccessKey) throw new Error('Backblaze B2 não configurado.');
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = amzDate.slice(0, 8);
  const scope = `${date}/${region}/s3/aws4_request`;
  const pathname = `/${awsEncode(config.bucket)}/${encodePath(key)}`;
  const parameters = [
    ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential', `${config.accessKeyId}/${scope}`],
    ['X-Amz-Date', amzDate],
    ['X-Amz-Expires', String(expires)],
    ['X-Amz-SignedHeaders', 'host']
  ];
  const query = canonicalQuery(parameters);
  const canonicalRequest = ['GET', pathname, query, `host:${endpoint.host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, hex(await sha256(canonicalRequest))].join('\n');
  const dateKey = await hmac(encoder.encode(`AWS4${config.secretAccessKey}`), date);
  const regionKey = await hmac(dateKey, region);
  const serviceKey = await hmac(regionKey, 's3');
  const signingKey = await hmac(serviceKey, 'aws4_request');
  parameters.push(['X-Amz-Signature', hex(await hmac(signingKey, stringToSign))]);
  return new URL(`${pathname}?${canonicalQuery(parameters)}`, endpoint).href;
}

function decodeXml(value) {
  return value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

export function parseB2Error(response, body) {
  const code = decodeXml(body.match(/<Code>([^<]*)<\/Code>/)?.[1] || 'UnknownError');
  const message = decodeXml(body.match(/<Message>([^<]*)<\/Message>/)?.[1] || `HTTP ${response.status}`);
  const requestId = decodeXml(body.match(/<RequestId>([^<]*)<\/RequestId>/i)?.[1] || response.headers.get('x-amz-request-id') || response.headers.get('x-bz-request-id') || '');
  const kind = response.status === 401 || response.status === 403
    ? (code === 'InvalidAccessKeyId' || code === 'SignatureDoesNotMatch' ? 'invalid_credentials' : 'bucket_inaccessible')
    : 'bucket_inaccessible';
  const statusText = response.statusText?.trim() || '';
  const error = new B2Error(kind, response.status, code, `Backblaze B2 respondeu ${response.status}${statusText ? ` ${statusText}` : ''} ${code}: ${message}`);
  error.statusText = statusText;
  error.requestId = requestId;
  return error;
}

async function b2Failure(response) {
  return parseB2Error(response, await response.text());
}

async function listGames(env, emulator) {
  const config = b2Config(env, emulator.id);
  const prefix = config.prefix;
  if (emulator.id === 'ps1') return listPs1Games(config, emulator);
  const response = await signedB2Fetch(config, 'GET', '', [['list-type', '2'], ['prefix', prefix]]);
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

function extensionOf(key) {
  const filename = key.split('/').pop() || '';
  const dot = filename.lastIndexOf('.');
  return dot < 1 ? '' : filename.slice(dot + 1).toLowerCase();
}

function safeObjectKey(key, prefix) {
  if (typeof key !== 'string' || !key.startsWith(prefix) || key === prefix || key.includes('\\')) return false;
  const relative = key.slice(prefix.length);
  return relative.split('/').every(part => part && part !== '.' && part !== '..' && !part.startsWith('.') && !part.endsWith('~') && !/\.(?:tmp|part|crdownload)$/i.test(part));
}

function ps1Slug(name) {
  const slug = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80).replace(/-$/g, '');
  return slug || 'jogo';
}

function fileKind(extension) {
  if (extension === 'cue') return 'cue';
  if (extension === 'bin') return 'bin';
  if (PS1_AUX_EXTENSIONS.has(extension)) return 'auxiliary';
  return 'disc';
}

function chooseCover(objects, gameName) {
  const images = objects.filter(object => PS1_COVER_EXTENSIONS.has(object.extension));
  if (!images.length) return null;
  const preferred = ['cover', 'capa', 'folder', gameName.toLowerCase()];
  return [...images].sort((a, b) => {
    const aName = friendlyName(a.key.split('/').pop()).toLowerCase(), bName = friendlyName(b.key.split('/').pop()).toLowerCase();
    const aRank = preferred.indexOf(aName), bRank = preferred.indexOf(bName);
    return (aRank < 0 ? preferred.length : aRank) - (bRank < 0 ? preferred.length : bRank) || a.key.localeCompare(b.key, 'pt-BR');
  })[0].key;
}

/** Normaliza exclusivamente metadados do ListObjects; nenhum conteúdo de ROM é lido. */
export function normalizePs1Library(objects, prefix = PS1_DEFAULTS.prefix) {
  const rootFiles = [], folders = new Map();
  for (const source of objects) {
    const key = source?.key;
    if (!safeObjectKey(key, prefix)) continue;
    const extension = extensionOf(key);
    if (!PS1_BOOT_EXTENSIONS.has(extension) && !PS1_AUX_EXTENSIONS.has(extension) && !PS1_COVER_EXTENSIONS.has(extension)) continue;
    const object = {key, extension, size: Number(source.size) || 0, lastModified: source.lastModified || null};
    const relative = key.slice(prefix.length), slash = relative.indexOf('/');
    if (slash < 0) rootFiles.push(object);
    else {
      const root = relative.slice(0, slash);
      if (!folders.has(root)) folders.set(root, []);
      folders.get(root).push(object);
    }
  }
  const candidates = [], consumedRoot = new Set();
  for (const object of rootFiles.filter(item => PS1_BOOT_EXTENSIONS.has(item.extension) && item.extension !== 'bin')) {
    const stem = object.key.replace(/\.[^.]+$/, '').toLocaleLowerCase('pt-BR');
    const related = rootFiles.filter(item => item === object || ((PS1_AUX_EXTENSIONS.has(item.extension) || PS1_COVER_EXTENSIONS.has(item.extension)) && item.key.replace(/\.[^.]+$/, '').toLocaleLowerCase('pt-BR') === stem));
    related.forEach(item => consumedRoot.add(item));
    candidates.push({name: friendlyName(object.key.split('/').pop()), type: 'single', objects: related, boot: object});
  }
  for (const object of rootFiles.filter(item => item.extension === 'bin' && !consumedRoot.has(item))) candidates.push({name: friendlyName(object.key.split('/').pop()), type: 'single', objects: [object], boot: object});
  for (const [name, folderObjects] of folders) {
    const boot = [...folderObjects].filter(object => PS1_BOOT_EXTENSIONS.has(object.extension)).sort((a, b) => PS1_BOOT_PRIORITY.indexOf(a.extension) - PS1_BOOT_PRIORITY.indexOf(b.extension) || a.key.localeCompare(b.key, 'pt-BR'))[0];
    if (boot) candidates.push({name, type: 'folder', objects: folderObjects, boot});
  }
  const usedIds = new Map();
  return candidates.map(candidate => {
    const base = ps1Slug(candidate.name), count = (usedIds.get(base) || 0) + 1; usedIds.set(base, count);
    const files = candidate.objects.filter(object => PS1_BOOT_EXTENSIONS.has(object.extension) || PS1_AUX_EXTENSIONS.has(object.extension)).sort((a, b) => a.key.localeCompare(b.key, 'pt-BR'));
    const hasBin = files.some(file => file.extension === 'bin');
    const format = candidate.boot.extension === 'cue' && hasBin ? 'cue+bin' : candidate.boot.extension;
    const coverKey = candidate.type === 'folder' ? chooseCover(candidate.objects, candidate.name) : null;
    return {id: count === 1 ? base : `${base}-${count}`, name: candidate.name, type: candidate.type, format, bootKey: candidate.boot.key, key: candidate.boot.key, coverKey, coverUrl: coverKey ? `/api/emulators/ps1/cover/${encodeURIComponent(coverKey)}` : null, files: files.map(file => ({key: file.key, type: fileKind(file.extension), size: file.size})), size: files.reduce((total, file) => total + file.size, 0), lastModified: files.map(file => file.lastModified).filter(Boolean).sort().at(-1) || null};
  }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

function validPs1Key(key, prefix, extensions) {
  return safeObjectKey(key, prefix) && extensions.includes(extensionOf(key));
}

async function listPs1Games(config, emulator) {
  console.log('[PS1-B2] listing bucket');
  console.log(`[PS1-B2] bucket=${config.bucket}`);
  console.log(`[PS1-B2] prefix=${config.prefix}`);
  const objects = [];
  let continuationToken = '';
  do {
    const params = [['list-type', '2'], ['prefix', config.prefix]];
    if (continuationToken) params.push(['continuation-token', continuationToken]);
    const response = await signedB2Fetch(config, 'GET', '', params);
    if (!response.ok) throw await b2Failure(response);
    const xml = await response.text();
    for (const content of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const key = decodeXml(content[1].match(/<Key>([\s\S]*?)<\/Key>/)?.[1] || '');
      if (!safeObjectKey(key, config.prefix)) continue;
      objects.push({key, size: Number(content[1].match(/<Size>(\d+)<\/Size>/)?.[1] || 0), lastModified: content[1].match(/<LastModified>([^<]+)<\/LastModified>/)?.[1] || null});
    }
    continuationToken = decodeXml(xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/)?.[1] || '');
  } while (continuationToken);
  const games = normalizePs1Library(objects, config.prefix);
  console.log(`[PS1-B2] object count=${objects.length}; game count=${games.length}`);
  if (!objects.length) {
    const probe = await signedB2Fetch(config, 'GET', '', [['list-type', '2'], ['max-keys', '1']]);
    if (!probe.ok) throw await b2Failure(probe);
    const probeXml = await probe.text();
    if (/<Contents>/.test(probeXml)) throw new B2Error('wrong_prefix', 404, 'PrefixNotFound', `Nenhum jogo encontrado no prefixo ${config.prefix}`);
  }
  return games;
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

function parseSingleRange(value) {
  const match = /^bytes=(\d+)-(\d+)$/.exec(value || '');
  if (!match) return null;
  const start = Number(match[1]), end = Number(match[2]);
  return Number.isSafeInteger(start) && Number.isSafeInteger(end) && start <= end ? {start, end} : null;
}

function ps1Debug(env, data) {
  if (String(env.PS1_STREAM_DEBUG).toLowerCase() !== 'true') return;
  console.log(`[PS1-STREAM] ${JSON.stringify(data)}`);
}

function beginPs1Trace(env, key, request) {
  if (String(env.PS1_STREAM_DEBUG).toLowerCase() !== 'true') return () => {};
  const range = parseSingleRange(request.headers.get('Range'));
  const state = ps1RequestHistory.get(key) || {active: 0, requests: 0, recent: []};
  const duplicate = Boolean(range && state.recent.some(item => item.start === range.start && item.end === range.end));
  const overlapping = Boolean(range && state.recent.some(item => item.start <= range.end && range.start <= item.end));
  const sequential = Boolean(range && state.recent.at(-1)?.end + 1 === range.start);
  state.active += 1; state.requests += 1;
  if (range) state.recent.push(range);
  state.recent = state.recent.slice(-32);
  ps1RequestHistory.set(key, state);
  ps1Debug(env, {event: 'start', method: request.method, range: request.headers.get('Range'), request: state.requests, duplicate, overlapping, sequential, parallel: state.active});
  return data => {
    state.active = Math.max(0, state.active - 1);
    ps1Debug(env, {event: 'response', ...data, parallel: state.active});
    if (ps1RequestHistory.size > 100) ps1RequestHistory.delete(ps1RequestHistory.keys().next().value);
  };
}

function cacheStorage() {
  return globalThis.caches?.default || null;
}

function blockCacheKey(request, key, start) {
  const digest = encodeURIComponent(key);
  return new Request(`${new URL(request.url).origin}/.internal/ps1-block/${digest}/${start}`);
}

async function fetchPs1Block(config, request, key, start, cache, env) {
  const cacheKey = blockCacheKey(request, key, start);
  const cached = cache && await cache.match(cacheKey);
  if (cached) return {response: cached, cacheStatus: 'HIT'};
  const end = start + PS1_BLOCK_SIZE - 1;
  const response = await signedB2Fetch(config, 'GET', key, [], {Range: `bytes=${start}-${end}`});
  if (response.status !== 206) return {response, cacheStatus: 'BYPASS'};
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', `public, max-age=${PS1_BLOCK_TTL}`);
  const stored = new Response(response.body, {status: 200, headers});
  if (cache) await cache.put(cacheKey, stored.clone());
  ps1Debug(env, {method: 'GET', key, backendRange: `bytes=${start}-${end}`, status: response.status, cache: 'MISS'});
  return {response: stored, cacheStatus: 'MISS'};
}

async function cachedPs1Range(config, request, key, range, env, ctx) {
  const requestedBytes = range.end - range.start + 1;
  if (requestedBytes > PS1_MAX_RANGE) return null;
  const firstBlock = Math.floor(range.start / PS1_BLOCK_SIZE) * PS1_BLOCK_SIZE;
  const lastBlock = Math.floor(range.end / PS1_BLOCK_SIZE) * PS1_BLOCK_SIZE;
  if (firstBlock !== lastBlock) return null;
  const started = Date.now();
  const cache = cacheStorage();
  const result = await fetchPs1Block(config, request, key, firstBlock, cache, env);
  if (result.response.status >= 400) return b2Response(result.response, request);
  const buffer = await result.response.arrayBuffer();
  const offset = range.start - firstBlock;
  if (offset >= buffer.byteLength) return null;
  const length = Math.min(requestedBytes, buffer.byteLength - offset);
  const total = Number(result.response.headers.get('Content-Range')?.split('/')[1]) || '*';
  const headers = new Headers(result.response.headers);
  headers.set('Content-Length', String(length));
  headers.set('Content-Range', `bytes ${range.start}-${range.start + length - 1}/${total}`);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'private, max-age=3600');
  headers.set('X-PS1-Cache', result.cacheStatus);
  headers.set('X-PS1-Block-Size', String(PS1_BLOCK_SIZE));
  headers.set('Server-Timing', `ps1;dur=${Date.now() - started};desc="${result.cacheStatus}"`);
  const nextStart = firstBlock + PS1_BLOCK_SIZE;
  if (ctx?.waitUntil && range.end > firstBlock + PS1_BLOCK_SIZE * 0.75) ctx.waitUntil(fetchPs1Block(config, request, key, nextStart, cache, env).then(() => undefined).catch(() => undefined));
  ps1Debug(env, {method: request.method, range: request.headers.get('Range'), status: 206, bytes: length, duration: Date.now() - started, cache: result.cacheStatus});
  return new Response(buffer.slice(offset, offset + length), {status: 206, headers});
}

function hasB2Config(env, emulatorId) {
  const config = b2Config(env, emulatorId);
  return Boolean(config.endpoint && config.bucket && config.accessKeyId && config.secretAccessKey);
}

function safeB2Log(config, error) {
  let message = error instanceof Error ? error.message : String(error);
  for (const secret of [config.accessKeyId, config.secretAccessKey]) if (secret) message = message.split(secret).join('[REDACTED]');
  console.error(JSON.stringify({message: 'B2 listing failure', emulator: 'ps1', endpoint: safeEndpoint(config.endpoint), bucket: config.bucket, prefix: config.prefix, error: message}));
}

function safeEndpoint(endpoint) {
  try { return new URL(endpoint).origin; } catch { return 'invalid_endpoint'; }
}

export async function emulatorApi(request, env, pathname = new URL(request.url).pathname, ctx) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return json({error: 'Método não permitido.'}, 405, {Allow: 'GET, HEAD'});
  if (pathname === '/api/emulators') return json({emulators: EMULATORS.map(({romExtensions, coreExtensions, ...item}) => item)}, 200, {'Cache-Control': PUBLIC_CACHE});
  if (pathname === '/api/emulators/ps1/diagnostics') {
    const config = b2Config(env, 'ps1');
    const diagnostic = {endpoint: safeEndpoint(config.endpoint), bucket: config.bucket, prefix: config.prefix, hasAccessKeyId: Boolean(config.accessKeyId), hasSecretAccessKey: Boolean(config.secretAccessKey)};
    if (!hasB2Config(env, 'ps1')) return json({...diagnostic, status: 'error', code: 'NotConfigured'}, 503);
    try {
      const response = await signedB2Fetch(config, 'GET', '', [['list-type', '2'], ['max-keys', '1'], ['prefix', config.prefix]]);
      if (!response.ok) throw await b2Failure(response);
      return json({...diagnostic, status: 'ok'});
    } catch (error) {
      safeB2Log(config, error);
      return json({...diagnostic, status: 'error', code: error instanceof B2Error ? error.code : 'RequestFailed'}, 503);
    }
  }
  if (pathname === '/api/emulators/ps1/signed-url') {
    const config = b2Config(env, 'ps1');
    const key = new URL(request.url).searchParams.get('game') || '';
    const emulator = findEmulator('ps1');
    if (!hasB2Config(env, 'ps1')) return json({error: 'Biblioteca de jogos não configurada.'}, 503);
    if (!safeObjectKey(key, config.prefix) || (!PS1_BOOT_EXTENSIONS.has(extensionOf(key)) && !PS1_AUX_EXTENSIONS.has(extensionOf(key)))) return json({error: 'Arquivo não encontrado.'}, 404);
    return json({url: await presignedB2Url(config, key), expiresIn: PS1_SIGNED_URL_TTL, method: 'GET'}, 200, {'Cache-Control': 'no-store'});
  }
  const gamesMatch = pathname.match(/^\/api\/emulators\/([^/]+)\/games$/);
  if (gamesMatch) {
    const emulator = findEmulator(gamesMatch[1]);
    if (!emulator) return json({error: 'Emulador não encontrado.'}, 404);
    if (!hasB2Config(env, emulator.id)) {
      const payload = {error: emulator.id === 'ps1' ? 'Biblioteca temporariamente indisponível.' : 'Biblioteca de jogos não configurada.'};
      if (emulator.id === 'ps1' && String(env.PS1_DIAGNOSTIC_MODE).toLowerCase() === 'true') payload.diagnostic = 'credentials_not_configured';
      return json(payload, 503);
    }
    try {
      const refresh = new URL(request.url).searchParams.get('refresh') === '1';
      return json({emulator: emulator.id, games: await listGames(env, emulator)}, 200, {'Cache-Control': refresh ? 'no-store' : PUBLIC_CACHE});
    }
    catch (error) {
      if (emulator.id === 'ps1') safeB2Log(b2Config(env, 'ps1'), error);
      else console.error('B2 listing failure', error);
      const payload = {error: 'Biblioteca temporariamente indisponível.'};
      if (emulator.id === 'ps1' && String(env.PS1_DIAGNOSTIC_MODE).toLowerCase() === 'true') payload.diagnostic = error.kind || 'request_failed';
      return json(payload, 503);
    }
  }
  const ps1CoverMatch = pathname.match(/^\/api\/emulators\/ps1\/cover\/(.+)$/);
  if (ps1CoverMatch) {
    let key;
    try { key = decodeURIComponent(ps1CoverMatch[1]); } catch { return json({error: 'Capa inválida.'}, 400); }
    const config = b2Config(env, 'ps1');
    if (!hasB2Config(env, 'ps1')) return json({error: 'Biblioteca de jogos não configurada.'}, 503);
    if (!safeObjectKey(key, config.prefix) || !PS1_COVER_EXTENSIONS.has(extensionOf(key))) return json({error: 'Capa não encontrada.'}, 404);
    try {
      const response = await signedB2Fetch(config, request.method, key);
      if (response.status === 404) return json({error: 'Capa não encontrada.'}, 404);
      const headers = new Headers(response.headers);
      const types = {jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp'};
      headers.set('Content-Type', types[extensionOf(key)]);
      headers.set('Cache-Control', PS1_COVER_CACHE);
      headers.set('X-Content-Type-Options', 'nosniff');
      return new Response(request.method === 'HEAD' ? null : response.body, {status: response.status, headers});
    } catch (error) { console.error('B2 cover failure', error); return json({error: 'Capa temporariamente indisponível.'}, 503); }
  }
  const ps1FileMatch = pathname.match(/^\/api\/emulators\/ps1\/file\/(.+)$/);
  if (ps1FileMatch) {
    const emulator = findEmulator('ps1');
    let key;
    try { key = decodeURIComponent(ps1FileMatch[1]); } catch { return json({error: 'Arquivo inválido.'}, 400); }
    const config = b2Config(env, 'ps1');
    if (!hasB2Config(env, 'ps1')) return json({error: 'Biblioteca de jogos não configurada.'}, 503);
    if (!safeObjectKey(key, config.prefix) || (!PS1_BOOT_EXTENSIONS.has(extensionOf(key)) && !PS1_AUX_EXTENSIONS.has(extensionOf(key)))) return json({error: 'Arquivo não encontrado.'}, 404);
    const finishTrace = beginPs1Trace(env, key, request);
    const headers = request.headers.has('Range') ? {Range: request.headers.get('Range')} : {};
    try {
      const range = parseSingleRange(headers.Range);
      if (request.method === 'GET' && range) {
        const cached = await cachedPs1Range(config, request, key, range, env, ctx);
        if (cached) { finishTrace({status: cached.status, bytes: Number(cached.headers.get('Content-Length')) || null, cache: cached.headers.get('X-PS1-Cache') || 'BYPASS'}); return cached; }
      }
      const started = Date.now();
      const response = await signedB2Fetch(config, request.method, key, [], headers);
      if (response.status === 404) return json({error: 'Arquivo não encontrado.'}, 404);
      ps1Debug(env, {method: request.method, range: headers.Range || null, status: response.status, bytes: Number(response.headers.get('Content-Length')) || null, duration: Date.now() - started, cache: 'BYPASS'});
      finishTrace({status: response.status, bytes: Number(response.headers.get('Content-Length')) || null, ttfb: Date.now() - started, cache: 'BYPASS'});
      return b2Response(response, request);
    } catch (error) { finishTrace({status: 503, cache: 'ERROR'}); console.error('B2 stream failure', error); return json({error: 'Arquivo temporariamente indisponível.'}, 503); }
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
  const response = await signedB2Fetch(b2Config(env, emulator.id), 'GET', found.key, [], headers);
  if (response.status === 404) return json({error: 'Jogo não encontrado.'}, 404);
  return b2Response(response, request);
}
