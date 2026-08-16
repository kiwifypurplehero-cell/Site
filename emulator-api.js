import {EMULATORS, findEmulator} from './emulator-registry.js';

const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';
const SAFE_SLUG = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const DEFAULT_PREFIX = 'ps2/jogos/';
const encoder = new TextEncoder();

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

async function signedB2Fetch(env, method, key = '', query = '', requestHeaders = {}) {
  const endpoint = new URL(env.B2_ENDPOINT);
  const regionMatch = endpoint.hostname.match(/^s3\.([^.]+)\.backblazeb2\.com$/);
  const region = regionMatch?.[1];
  if (!region || !env.B2_BUCKET || !env.B2_ACCESS_KEY_ID || !env.B2_SECRET_ACCESS_KEY) throw new Error('Backblaze B2 não configurado.');

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = amzDate.slice(0, 8);
  const pathname = `/${encodeURIComponent(env.B2_BUCKET)}/${encodePath(key)}`;
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
  const dateKey = await hmac(encoder.encode(`AWS4${env.B2_SECRET_ACCESS_KEY}`), date);
  const regionKey = await hmac(dateKey, region);
  const serviceKey = await hmac(regionKey, 's3');
  const signingKey = await hmac(serviceKey, 'aws4_request');
  const signature = hex(await hmac(signingKey, stringToSign));
  headers.set('Authorization', `AWS4-HMAC-SHA256 Credential=${env.B2_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signedHeaderNames.join(';')}, Signature=${signature}`);
  headers.delete('host');
  return fetch(url, {method, headers});
}

function decodeXml(value) {
  return value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

async function listGames(env, emulator) {
  const prefix = env.B2_PS2_PREFIX || DEFAULT_PREFIX;
  const query = new URLSearchParams({'list-type': '2', prefix}).toString();
  const response = await signedB2Fetch(env, 'GET', '', query);
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

async function findGame(env, emulator, slug) {
  const prefix = env.B2_PS2_PREFIX || DEFAULT_PREFIX;
  for (const extension of emulator.romExtensions) {
    const key = `${prefix}${slug}/game.${extension}`;
    const response = await signedB2Fetch(env, 'HEAD', key);
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

function hasB2Config(env) {
  return Boolean(env.B2_ENDPOINT && env.B2_BUCKET && env.B2_ACCESS_KEY_ID && env.B2_SECRET_ACCESS_KEY);
}

export async function emulatorApi(request, env, pathname = new URL(request.url).pathname) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return json({error: 'Método não permitido.'}, 405, {Allow: 'GET, HEAD'});
  if (pathname === '/api/emulators') return json({emulators: EMULATORS.map(({romExtensions, ...item}) => item)}, 200, {'Cache-Control': PUBLIC_CACHE});
  const gamesMatch = pathname.match(/^\/api\/emulators\/([^/]+)\/games$/);
  if (gamesMatch) {
    const emulator = findEmulator(gamesMatch[1]);
    if (!emulator) return json({error: 'Emulador não encontrado.'}, 404);
    if (!hasB2Config(env)) return json({error: 'Biblioteca de jogos não configurada.'}, 503);
    return json({emulator: emulator.id, games: await listGames(env, emulator)}, 200, {'Cache-Control': PUBLIC_CACHE});
  }
  const romMatch = pathname.match(/^\/api\/emulators\/([^/]+)\/games\/([^/]+)\/rom$/);
  if (!romMatch) return null;
  const emulator = findEmulator(romMatch[1]);
  const slug = decodeURIComponent(romMatch[2]).toLowerCase();
  if (!emulator || !SAFE_SLUG.test(slug)) return json({error: 'Jogo não encontrado.'}, 404);
  if (!hasB2Config(env)) return json({error: 'Biblioteca de jogos não configurada.'}, 503);
  const found = await findGame(env, emulator, slug);
  if (!found) return json({error: 'Jogo não encontrado.'}, 404);
  if (request.method === 'HEAD') return b2Response(found.response, request);
  const headers = request.headers.has('Range') ? {Range: request.headers.get('Range')} : {};
  const response = await signedB2Fetch(env, 'GET', found.key, '', headers);
  if (response.status === 404) return json({error: 'Jogo não encontrado.'}, 404);
  return b2Response(response, request);
}
