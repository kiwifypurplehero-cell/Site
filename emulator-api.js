import {EMULATORS, findEmulator} from './emulator-registry.js';

const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';
const SAFE_SLUG = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {status, headers: {'Content-Type': 'application/json; charset=utf-8', ...headers}});
}

function titleFromSlug(slug) {
  return slug.split('-').map(word => word ? word[0].toUpperCase() + word.slice(1) : '').join(' ');
}

function parseGameObject(emulator, object) {
  const relative = object.key.slice(emulator.objectPrefix.length);
  const match = relative.match(/^([^/]+)\/([^/]+)\.([a-z0-9]+)$/i);
  if (!match || !SAFE_SLUG.test(match[1]) || !emulator.romExtensions.includes(match[3].toLowerCase())) return null;
  return {slug: match[1], title: titleFromSlug(match[1]), format: match[3].toUpperCase(), size: object.size, updatedAt: object.uploaded?.toISOString?.() || object.uploaded || null, objectKey: object.key};
}

export async function detectGames(bucket, emulator) {
  const games = new Map();
  let cursor;
  do {
    const page = await bucket.list({prefix: emulator.objectPrefix, cursor, limit: 1000});
    for (const object of page.objects || []) {
      const game = parseGameObject(emulator, object);
      if (game && !games.has(game.slug)) games.set(game.slug, game);
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return [...games.values()].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')).map(({objectKey, ...game}) => game);
}

async function findGameObject(bucket, emulator, slug) {
  for (const extension of emulator.romExtensions) {
    const key = `${emulator.objectPrefix}${slug}/game.${extension}`;
    const object = await bucket.head(key);
    if (object) return {key, object};
  }
  return null;
}

function romResponse(object, request, body = null) {
  const headers = new Headers({'Accept-Ranges': 'bytes', 'Cache-Control': 'private, max-age=3600', 'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream'});
  object.writeHttpMetadata?.(headers);
  const range = object.range;
  if (range && typeof range.offset === 'number' && typeof range.length === 'number') {
    headers.set('Content-Range', `bytes ${range.offset}-${range.offset + range.length - 1}/${object.size}`);
    headers.set('Content-Length', String(range.length));
    return new Response(request.method === 'HEAD' ? null : body, {status: 206, headers});
  }
  headers.set('Content-Length', String(object.size));
  return new Response(request.method === 'HEAD' ? null : body, {status: 200, headers});
}

export async function emulatorApi(request, env, pathname = new URL(request.url).pathname) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return json({error: 'Método não permitido.'}, 405, {Allow: 'GET, HEAD'});
  if (pathname === '/api/emulators') return json({emulators: EMULATORS.map(({objectPrefix, romExtensions, ...item}) => item)}, 200, {'Cache-Control': PUBLIC_CACHE});
  const gamesMatch = pathname.match(/^\/api\/emulators\/([^/]+)\/games$/);
  if (gamesMatch) {
    const emulator = findEmulator(gamesMatch[1]);
    if (!emulator) return json({error: 'Emulador não encontrado.'}, 404);
    if (!env.GAME_ROMS) return json({error: 'Biblioteca de jogos não configurada.'}, 503);
    const games = await detectGames(env.GAME_ROMS, emulator);
    return json({emulator: emulator.id, games}, 200, {'Cache-Control': PUBLIC_CACHE});
  }
  const romMatch = pathname.match(/^\/api\/emulators\/([^/]+)\/games\/([^/]+)\/rom$/);
  if (!romMatch) return null;
  const emulator = findEmulator(romMatch[1]);
  const slug = decodeURIComponent(romMatch[2]).toLowerCase();
  if (!emulator || !SAFE_SLUG.test(slug)) return json({error: 'Jogo não encontrado.'}, 404);
  if (!env.GAME_ROMS) return json({error: 'Biblioteca de jogos não configurada.'}, 503);
  const found = await findGameObject(env.GAME_ROMS, emulator, slug);
  if (!found) return json({error: 'Jogo não encontrado.'}, 404);
  if (request.method === 'HEAD') return romResponse(found.object, request);
  const object = await env.GAME_ROMS.get(found.key, request.headers.has('Range') ? {range: request.headers} : undefined);
  if (!object) return json({error: 'Jogo não encontrado.'}, 404);
  return romResponse(object, request, object.body);
}
