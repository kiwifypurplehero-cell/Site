import test from 'node:test';
import assert from 'node:assert/strict';
import {emulatorApi, parseB2Error} from '../emulator-api.js';

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
  assert.deepEqual(await response.json(), {error: 'Biblioteca temporariamente indisponível.'});
});

test('diagnóstico informa configuração sem revelar os valores das chaves', async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (request, init) => {
    const url = new URL(String(request));
    assert.equal(url.pathname, '/plumpgames-storage-ps1/');
    assert.equal(url.search, '?list-type=2&max-keys=1&prefix=Jogos%2F');
    assert.match(init.headers.get('Authorization'), /^AWS4-HMAC-SHA256 Credential=test-id\/\d{8}\/us-east-005\/s3\/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=[a-f0-9]{64}$/);
    assert.equal(init.headers.get('x-amz-content-sha256'), 'UNSIGNED-PAYLOAD');
    return new Response('<ListBucketResult/>');
  };
  const response = await emulatorApi(new Request('https://example.com/api/emulators/ps1/diagnostics'), ps1Env);
  const body = await response.json();
  assert.deepEqual(body, {endpoint: 'https://s3.us-east-005.backblazeb2.com', bucket: 'plumpgames-storage-ps1', prefix: 'Jogos/', hasAccessKeyId: true, hasSecretAccessKey: true, status: 'ok'});
  assert.doesNotMatch(JSON.stringify(body), /test-id|test-secret/);
});

for (const [status, code] of [[400, 'SignatureDoesNotMatch'], [403, 'AccessDenied'], [401, 'InvalidAccessKeyId']]) {
  test(`extrai erro XML ${status} ${code} e mantém a resposta pública genérica`, async t => {
    const originalFetch = globalThis.fetch;
    const originalError = console.error;
    const logs = [];
    t.after(() => { globalThis.fetch = originalFetch; console.error = originalError; });
    console.error = value => logs.push(String(value));
    globalThis.fetch = async () => new Response(`<Error><Code>${code}</Code><Message>failure test-id test-secret</Message><RequestId>request-123</RequestId></Error>`, {status, statusText: 'B2 failure'});
    const response = await emulatorApi(new Request('https://example.com/api/emulators/ps1/games'), ps1Env);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {error: 'Biblioteca temporariamente indisponível.'});
    const log = JSON.parse(logs.at(-1));
    assert.equal(log.message, 'B2 listing failure');
    assert.match(log.error, new RegExp(`${status} B2 failure ${code}`));
    assert.doesNotMatch(logs.join('\n'), /test-id|test-secret|Authorization|Signature=/);
  });
}

test('parseB2Error preserva metadados seguros do erro Backblaze', () => {
  const response = new Response('', {status: 403, statusText: 'Forbidden', headers: {'x-amz-request-id': 'header-request-id'}});
  const error = parseB2Error(response, '<Error><Code>AccessDenied</Code><Message>not authorized</Message></Error>');
  assert.equal(error.status, 403);
  assert.equal(error.statusText, 'Forbidden');
  assert.equal(error.code, 'AccessDenied');
  assert.equal(error.requestId, 'header-request-id');
  assert.equal(error.message, 'Backblaze B2 respondeu 403 Forbidden AccessDenied: not authorized');
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

test('amplia Range pequeno para bloco alinhado e devolve 206 correto', async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (_request, init) => {
    assert.equal(init.headers.get('Range'), 'bytes=0-4194303');
    return new Response(new Uint8Array([1, 2, 3]), {status: 206, headers: {'Content-Range': 'bytes 0-2/123456789', 'Content-Length': '3', 'Content-Type': 'application/octet-stream'}});
  };
  const request = new Request('https://example.com/api/emulators/ps1/file/Jogos/Gran%20Turismo.iso', {headers: {Range: 'bytes=0-1048575'}});
  const response = await emulatorApi(request, ps1Env);
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('accept-ranges'), 'bytes');
  assert.equal(response.headers.get('content-range'), 'bytes 0-2/123456789');
  assert.equal(response.headers.get('content-length'), '3');
  assert.equal(response.headers.get('x-ps1-cache'), 'MISS');
  assert.equal(response.headers.get('x-ps1-block-size'), '4194304');
  assert.ok(response.body instanceof ReadableStream);
});

test('cache segmentado reutiliza bloco sem novo download do B2', async t => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  const entries = new Map();
  globalThis.caches = {default: {
    async match(request) { return entries.get(request.url)?.clone(); },
    async put(request, response) { entries.set(request.url, response.clone()); }
  }};
  let backendRequests = 0;
  globalThis.fetch = async (_request, init) => {
    backendRequests += 1;
    assert.equal(init.headers.get('Range'), 'bytes=0-4194303');
    return new Response(new Uint8Array(2048), {status: 206, headers: {'Content-Range': 'bytes 0-2047/679619808', 'Content-Length': '2048'}});
  };
  t.after(() => { globalThis.fetch = originalFetch; globalThis.caches = originalCaches; });
  const request = () => new Request('https://example.com/api/emulators/ps1/file/Jogos/Gran%20Turismo.iso', {headers: {Range: 'bytes=0-1023'}});
  const first = await emulatorApi(request(), ps1Env);
  const second = await emulatorApi(request(), ps1Env);
  assert.equal(first.status, 206);
  assert.equal(first.headers.get('x-ps1-cache'), 'MISS');
  assert.equal(second.headers.get('x-ps1-cache'), 'HIT');
  assert.equal(second.headers.get('content-range'), 'bytes 0-1023/679619808');
  assert.equal(backendRequests, 1);
});

test('signed URL SigV4 é restrita ao jogo e expira em dez minutos', async () => {
  const response = await emulatorApi(new Request('https://example.com/api/emulators/ps1/signed-url?game=Jogos%2FGran%20Turismo.iso'), ps1Env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const payload = await response.json();
  const url = new URL(payload.url);
  assert.equal(url.pathname, '/plumpgames-storage-ps1/Jogos/Gran%20Turismo.iso');
  assert.equal(url.searchParams.get('X-Amz-Expires'), '600');
  assert.equal(url.searchParams.get('X-Amz-SignedHeaders'), 'host');
  assert.match(url.searchParams.get('X-Amz-Signature'), /^[a-f0-9]{64}$/);
  assert.equal(payload.method, 'GET');
  assert.equal(JSON.stringify(payload).includes('test-secret'), false);
});
