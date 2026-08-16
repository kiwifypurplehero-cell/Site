import test from 'node:test';
import assert from 'node:assert/strict';
import {emulatorApi} from '../emulator-api.js';

const ps1Env = {B2_PS1_ACCESS_KEY_ID: 'test-id', B2_PS1_SECRET_ACCESS_KEY: 'test-secret'};

test('não expõe chaves internas no catálogo de emuladores', async () => {
  const response = await emulatorApi(new Request('https://example.com/api/emulators'), {});
  const payload = await response.json();
  assert.deepEqual(payload.emulators.map(item => item.id), ['ps1', 'ps2']);
  assert.equal(payload.emulators[0].romExtensions, undefined);
});

test('exige os secrets PS1 do Backblaze B2 para acessar a biblioteca', async () => {
  const response = await emulatorApi(new Request('https://example.com/api/emulators/ps1/games'), {});
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {error: 'Não foi possível acessar a biblioteca PS1.'});
});

test('não aceita secrets PS2 no endpoint PS1', async () => {
  const response = await emulatorApi(new Request('https://example.com/api/emulators/ps1/games'), {
    B2_ACCESS_KEY_ID: 'ps2-id', B2_SECRET_ACCESS_KEY: 'ps2-secret'
  });
  assert.equal(response.status, 503);
});

test('bloqueia traversal e objetos fora de Jogos/', async () => {
  for (const key of ['..%2Fsegredo.iso', 'Jogos%2F..%2Fsegredo.iso', 'ps1%2FJogos%2FGran%20Turismo.iso']) {
    const response = await emulatorApi(new Request(`https://example.com/api/emulators/ps1/file/${key}`), ps1Env);
    assert.equal(response.status, 404);
  }
});

test('lista automaticamente apenas imagens PS1 aceitas com metadados amigáveis', async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async request => {
    assert.match(String(request), /plumpgames-storage-ps1.*prefix=Jogos%2F/);
    return new Response(`<ListBucketResult>
      <Contents><Key>Jogos/Gran Turismo.iso</Key><LastModified>2026-08-16T00:00:00Z</LastModified><Size>123456789</Size></Contents>
      <Contents><Key>Jogos/.oculto.bin</Key><Size>1</Size></Contents>
      <Contents><Key>Jogos/capa.jpg</Key><Size>2</Size></Contents>
      <Contents><Key>Jogos/Crash_Bandicoot.chd</Key><LastModified>2026-08-17T00:00:00Z</LastModified><Size>42</Size></Contents>
    </ListBucketResult>`, {status: 200});
  };
  const response = await emulatorApi(new Request('https://example.com/api/emulators/ps1/games'), ps1Env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=60, stale-while-revalidate=300');
  assert.deepEqual((await response.json()).games, [
    {key: 'Jogos/Crash_Bandicoot.chd', name: 'Crash Bandicoot', format: 'chd', size: 42, lastModified: '2026-08-17T00:00:00Z'},
    {key: 'Jogos/Gran Turismo.iso', name: 'Gran Turismo', format: 'iso', size: 123456789, lastModified: '2026-08-16T00:00:00Z'}
  ]);
});

test('encaminha Range ao B2 e transmite a resposta parcial sem buffer', async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (_request, init) => {
    assert.equal(init.headers.get('Range'), 'bytes=0-1048575');
    return new Response(new Uint8Array([1, 2, 3]), {status: 206, headers: {'Content-Range': 'bytes 0-2/123456789', 'Content-Length': '3', 'Content-Type': 'application/octet-stream'}});
  };
  const request = new Request('https://example.com/api/emulators/ps1/file/Jogos/Gran%20Turismo.iso', {headers: {Range: 'bytes=0-1048575'}});
  const response = await emulatorApi(request, ps1Env);
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('accept-ranges'), 'bytes');
  assert.equal(response.headers.get('content-range'), 'bytes 0-2/123456789');
  assert.equal(response.headers.get('content-length'), '3');
  assert.ok(response.body instanceof ReadableStream);
});
