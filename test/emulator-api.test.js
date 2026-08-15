import test from 'node:test';
import assert from 'node:assert/strict';
import {detectGames, emulatorApi} from '../emulator-api.js';
import {findEmulator} from '../emulator-registry.js';

test('detecta somente ROMs válidas dentro do prefixo PS2', async () => {
  const bucket = {list: async () => ({objects: [
    {key: 'emulators/ps2/games/gran-turismo-4/game.iso', size: 10, uploaded: new Date('2026-01-01')},
    {key: 'emulators/ps2/games/shadow-colossus/game.chd', size: 20},
    {key: 'emulators/ps2/games/INVALID!/game.iso', size: 30},
    {key: 'emulators/ps2/games/readme.txt', size: 1}
  ], truncated: false})};
  const games = await detectGames(bucket, findEmulator('ps2'));
  assert.deepEqual(games.map(game => game.slug), ['gran-turismo-4', 'shadow-colossus']);
  assert.equal(games[0].title, 'Gran Turismo 4');
});

test('responde Range Request da ROM com 206 e Content-Range', async () => {
  const bytes = new Uint8Array([2, 3]);
  const metadata = {size: 4, httpMetadata: {contentType: 'application/x-iso9660-image'}};
  const bucket = {
    head: async key => key.endsWith('.iso') ? metadata : null,
    get: async () => ({...metadata, range: {offset: 1, length: 2}, body: bytes})
  };
  const request = new Request('https://example.com/api/emulators/ps2/games/test-game/rom', {headers: {Range: 'bytes=1-2'}});
  const response = await emulatorApi(request, {GAME_ROMS: bucket});
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('Content-Range'), 'bytes 1-2/4');
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
});

test('não expõe chaves internas no catálogo de emuladores', async () => {
  const response = await emulatorApi(new Request('https://example.com/api/emulators'), {});
  const payload = await response.json();
  assert.equal(payload.emulators[0].id, 'ps2');
  assert.equal(payload.emulators[0].objectPrefix, undefined);
});
