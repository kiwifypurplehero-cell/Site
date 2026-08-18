import test from 'node:test';
import assert from 'node:assert/strict';
import {emulatorApi, normalizeGbaLibrary, normalizeGbcLibrary, normalizePs1Library, parseB2Error} from '../emulator-api.js';

const ps1Env = {B2_PS1_ACCESS_KEY_ID: 'test-id', B2_PS1_SECRET_ACCESS_KEY: 'test-secret'};

test('não expõe chaves internas no catálogo de emuladores', async () => {
  const response = await emulatorApi(new Request('https://example.com/api/emulators'), {});
  const payload = await response.json();
  assert.deepEqual(payload.emulators.map(item => item.id), ['ps1', 'gbc', 'gba']);
  assert.equal(payload.emulators[0].romExtensions, undefined);
});

test('GBC normaliza ROMs na raiz e pasta com capa sem misturar PS1', () => {
  const games = normalizeGbcLibrary([
    {key: 'Jogos-GBC/Pokemon Crystal.gbc', size: 2048},
    {key: 'Jogos-GBC/Pokemon Gold/Pokemon Gold.gb', size: 1024},
    {key: 'Jogos-GBC/Pokemon Gold/cover.jpg', size: 50},
    {key: 'Jogos-GBC/loose.png', size: 10},
    {key: 'Jogos/Gran Turismo.iso', size: 999},
    {key: 'Jogos-GBC/x/../secret.gbc', size: 1}
  ]);
  assert.equal(games.length, 2);
  assert.equal(games.find(game => game.name === 'Pokemon Crystal').format, 'gbc');
  assert.equal(games.find(game => game.name === 'Pokemon Gold').format, 'gb');
  assert.equal(games.find(game => game.name === 'Pokemon Gold').coverKey, 'Jogos-GBC/Pokemon Gold/cover.jpg');
  assert.doesNotMatch(JSON.stringify(games), /Gran Turismo|loose\.png|secret/);
});

test('endpoints de arquivo bloqueiam acesso cruzado entre PS1 e GBC', async () => {
  const gbcEnv = {B2_GBC_ENDPOINT: 'https://s3.us-east-005.backblazeb2.com', B2_GBC_BUCKET: 'gbc-test', B2_GBC_ACCESS_KEY_ID: 'gbc-id', B2_GBC_SECRET_ACCESS_KEY: 'gbc-secret'};
  assert.equal((await emulatorApi(new Request('https://example.com/api/emulators/gbc/file/Jogos%2FGran%20Turismo.iso'), gbcEnv)).status, 404);
  assert.equal((await emulatorApi(new Request('https://example.com/api/emulators/ps1/file/Jogos-GBC%2FPokemon.gbc'), ps1Env)).status, 404);
  assert.equal((await emulatorApi(new Request('https://example.com/api/emulators/gbc/file/Jogos-GBC%2F..%2Fsecret.gbc'), gbcEnv)).status, 404);
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

test('scanner normaliza raiz, pastas, prioridade, capas e multidisc sem duplicar arquivos', () => {
  const objects = [
    {key: 'Jogos/Gran Turismo.iso', size: 679619808},
    {key: 'Jogos/Crash Bandicoot (PT-BR)/Crash Bandicoot (PT-BR).bin', size: 250000000},
    {key: 'Jogos/Crash Bandicoot (PT-BR)/Crash Bandicoot (PT-BR).cue', size: 500},
    {key: 'Jogos/Crash Bandicoot (PT-BR)/Crash Bandicoot (PT-BR).JPG', size: 9000},
    {key: 'Jogos/Resident Evil 2/Disc 1/Disc 1.cue', size: 100},
    {key: 'Jogos/Resident Evil 2/Disc 1/Disc 1.bin', size: 10},
    {key: 'Jogos/Resident Evil 2/Resident Evil 2.m3u', size: 50},
    {key: 'Jogos/Resident Evil 2/capa.webp', size: 1000},
    {key: 'Jogos/Tekken 3.chd', size: 3},
    {key: 'Jogos/Final Fantasy (Edição Áurea).pbp', size: 4},
    {key: 'Jogos/folder.JPG', size: 2},
    {key: 'Jogos/x/../segredo.iso', size: 1}
  ];
  const games = normalizePs1Library(objects);
  assert.equal(games.length, 5);
  const crash = games.find(game => game.id === 'crash-bandicoot-pt-br');
  assert.equal(crash.type, 'folder'); assert.equal(crash.format, 'cue+bin');
  assert.match(crash.bootKey, /\.cue$/); assert.match(crash.coverKey, /\.JPG$/);
  assert.equal(crash.files.length, 2); assert.equal(crash.size, 250000500);
  const multidisc = games.find(game => game.id === 'resident-evil-2');
  assert.match(multidisc.bootKey, /\.m3u$/); assert.equal(multidisc.files.length, 3);
  assert.equal(games.filter(game => game.name === 'Gran Turismo').length, 1);
  assert.equal(games.find(game => game.name === 'Gran Turismo').id, 'gran-turismo');
  assert.ok(games.some(game => game.name === 'Final Fantasy (Edição Áurea)'));
  assert.ok(games.some(game => game.format === 'chd'));
  assert.equal(games.some(game => game.name === 'folder'), false);
  assert.equal(JSON.stringify(games).includes('segredo'), false);
});

test('ids com caracteres especiais são seguros e colisões não dependem da ordem da lista', () => {
  const objects = [
    {key: 'Jogos/Áção & Aventura!.iso', size: 1},
    {key: 'Jogos/Ação @ Aventura.iso', size: 1}
  ];
  const first = normalizePs1Library(objects).map(game => [game.bootKey, game.id]).sort();
  const reversed = normalizePs1Library([...objects].reverse()).map(game => [game.bootKey, game.id]).sort();
  assert.deepEqual(first, reversed);
  for (const [, id] of first) assert.match(id, /^[a-z0-9-]+$/);
});

test('listagem usa somente ListObjects e devolve jogos normalizados', async t => {
  const originalFetch = globalThis.fetch; let calls = 0;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async request => { calls += 1; assert.match(String(request), /prefix=Jogos%2F/); return new Response(`<ListBucketResult>
    <Contents><Key>Jogos/Gran Turismo.iso</Key><Size>123</Size></Contents>
    <Contents><Key>Jogos/Crash/Crash.bin</Key><Size>100</Size></Contents>
    <Contents><Key>Jogos/Crash/Crash.cue</Key><Size>1</Size></Contents>
    <Contents><Key>Jogos/Crash/cover.JPG</Key><Size>2</Size></Contents>
  </ListBucketResult>`, {status: 200}); };
  const response = await emulatorApi(new Request('https://example.com/api/emulators/ps1/games'), ps1Env);
  const games = (await response.json()).games;
  assert.equal(response.status, 200); assert.equal(calls, 1); assert.equal(games.length, 2);
  assert.equal(games.find(game => game.name === 'Crash').format, 'cue+bin');
});

test('capa segura preserva stream, Content-Type e cache público', async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => new Response(new Uint8Array([1, 2]), {headers: {'Content-Type': 'application/octet-stream'}});
  const response = await emulatorApi(new Request('https://example.com/api/emulators/ps1/cover/Jogos%2FCrash%2FCrash.JPG'), ps1Env);
  assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), 'image/jpeg');
  assert.match(response.headers.get('cache-control'), /max-age=86400/); assert.ok(response.body instanceof ReadableStream);
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


test('GBA normaliza raiz e subpasta com capa e ID seguro', () => {
  const games=normalizeGbaLibrary([{key:'Jogos-GBA/Pokémon Emerald (BR).gba',size:32},{key:'Jogos-GBA/Metroid Fusion/Metroid Fusion.gba',size:64,lastModified:'2026-01-01'},{key:'Jogos-GBA/Metroid Fusion/capa.webp',size:2},{key:'Jogos-GBC/Outro.gba',size:1}]);
  assert.equal(games.length,2);
  const metroid=games.find(game=>game.name==='Metroid Fusion');
  assert.equal(metroid.bootKey,'Jogos-GBA/Metroid Fusion/Metroid Fusion.gba');
  assert.equal(metroid.coverKey,'Jogos-GBA/Metroid Fusion/capa.webp');
  assert.match(metroid.id,/^[a-z0-9-]+$/);
});
