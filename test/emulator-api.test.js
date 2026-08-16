import test from 'node:test';
import assert from 'node:assert/strict';
import {emulatorApi} from '../emulator-api.js';

test('não expõe chaves internas no catálogo de emuladores', async () => {
  const response = await emulatorApi(new Request('https://example.com/api/emulators'), {});
  const payload = await response.json();
  assert.equal(payload.emulators[0].id, 'ps2');
  assert.equal(payload.emulators[0].romExtensions, undefined);
});

test('exige os secrets do Backblaze B2 para acessar a biblioteca', async () => {
  const response = await emulatorApi(new Request('https://example.com/api/emulators/ps2/games'), {});
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {error: 'Biblioteca de jogos não configurada.'});
});
