import test from 'node:test';
import assert from 'node:assert/strict';
import {createPs1Archive, downloadPs1Content, inspectPs1File, ps1StreamUrl} from '../ps1-utils.js';

test('codifica espaço e barra da key exatamente uma vez', () => {
  const expected = '/api/emulators/ps1/file/Jogos%2FGran%20Turismo.iso';
  assert.equal(ps1StreamUrl({key: 'Jogos/Gran Turismo.iso'}), expected);
  assert.equal(ps1StreamUrl({key: 'Jogos%2FGran%20Turismo.iso'}), expected);
  assert.equal(ps1StreamUrl({key: 'Jogos%252FGran%2520Turismo.iso'}), expected);
  assert.doesNotMatch(ps1StreamUrl({key: 'Jogos/Gran Turismo.iso'}), /%25(?:2F|20)/i);
});

test('HEAD 200 confirma disponibilidade sem baixar o corpo', async () => {
  const calls = [];
  const result = await inspectPs1File('/game.iso', {log() {}, fetchImpl: async (url, init) => {
    calls.push([url, init]);
    return new Response(null, {status: 200, headers: {'Content-Length': '679619808', 'Accept-Ranges': 'bytes'}});
  }});
  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1].method, 'HEAD');
});

test('HEAD com erro usa GET de um byte e aceita 206', async () => {
  const calls = [];
  const result = await inspectPs1File('/game.iso', {log() {}, fetchImpl: async (url, init) => {
    calls.push(init);
    return init.method === 'HEAD' ? new Response(null, {status: 403}) : new Response(new Uint8Array([0]), {status: 206});
  }});
  assert.equal(result.ok, true);
  assert.equal(calls[1].headers.Range, 'bytes=0-0');
});

test('erro de rede não é convertido em HTTP 403 nem bloqueia o loader', async () => {
  const result = await inspectPs1File('/game.iso', {log() {}, fetchImpl: async () => { throw new TypeError('Failed to fetch'); }});
  assert.equal(result.ok, null);
  assert.equal(result.warning.kind, 'network-or-cors');
  assert.doesNotMatch(result.warning.message, /403/);
});

import {resolvePs1Launch} from '../ps1-utils.js';

test('resolve launch usa bootKey CUE e expõe BIN como dependência segura', () => {
  const launch = resolvePs1Launch({bootKey: 'Jogos/Crash (PT-BR)/Crash.cue', format: 'cue+bin', files: [{key: 'Jogos/Crash (PT-BR)/Crash.cue'}, {key: 'Jogos/Crash (PT-BR)/Crash.bin', type: 'bin'}]});
  assert.equal(launch.bootUrl, '/api/emulators/ps1/file/Jogos%2FCrash%20(PT-BR)%2FCrash.cue');
  assert.equal(launch.dependencies[0].url, '/api/emulators/ps1/file/Jogos%2FCrash%20(PT-BR)%2FCrash.bin');
});

test('monta CUE e BIN em ZIP armazenado com nomes que o CUE consegue resolver', async () => {
  const archive = await createPs1Archive([
    {key: 'Jogos/Crash (PT-BR)/Crash.cue', blob: new Blob(['FILE "Crash.bin" BINARY\n'])},
    {key: 'Jogos/Crash (PT-BR)/Crash.bin', blob: new Blob([new Uint8Array([1, 2, 3, 4])])}
  ]);
  const bytes = new Uint8Array(await archive.arrayBuffer());
  const text = new TextDecoder().decode(bytes);
  assert.equal(archive.type, 'application/zip');
  assert.match(text, /Crash\.cue/);
  assert.match(text, /Crash\.bin/);
  assert.equal(new DataView(bytes.buffer).getUint32(0, true), 0x04034b50);
  assert.equal(new DataView(bytes.buffer).getUint32(bytes.length - 22, true), 0x06054b50);
});

test('mede progresso agregado real de CUE+BIN e transfere cada arquivo uma vez', async () => {
  const bodies = new Map([['cue', new Uint8Array(20)], ['bin', new Uint8Array(980)]]), gets = [];
  const game = {bootKey:'Crash.cue',format:'cue+bin',files:[{key:'Crash.cue'},{key:'Crash.bin'}]};
  const progress = [];
  const result = await downloadPs1Content(game, {fetchImpl:async (url, init={}) => {
    const key = url.endsWith('Crash.cue') ? 'cue' : 'bin', body=bodies.get(key);
    if(init.method==='HEAD') return new Response(null,{headers:{'Content-Length':String(body.length)}});
    gets.push(key); return new Response(body,{headers:{'Content-Length':String(body.length)}});
  },onProgress:value=>progress.push(value)});
  assert.deepEqual(gets,['cue','bin']); assert.equal(result.loadedBytes,1000); assert.equal(result.totalBytes,1000);
  assert.equal(progress.at(-1).loadedBytes,1000); assert.equal(progress.at(-1).totalBytes,1000);
  URL.revokeObjectURL(result.gameUrl);
});

test('ISO usa uma única transferência GET e respeita AbortSignal', async () => {
  let gets=0; const game={bootKey:'Gran Turismo.iso',format:'iso',files:[{key:'Gran Turismo.iso'}]};
  const result=await downloadPs1Content(game,{fetchImpl:async(_url,init={})=>{if(init.method==='HEAD')return new Response(null,{headers:{'Content-Length':'4'}});gets++;return new Response(new Uint8Array(4),{headers:{'Content-Length':'4'}});}});
  assert.equal(gets,1); assert.equal(result.archive,null); assert.equal(result.totalBytes,4); URL.revokeObjectURL(result.gameUrl);
  const controller=new AbortController();controller.abort();
  await assert.rejects(downloadPs1Content(game,{signal:controller.signal,fetchImpl:async(_url,{signal})=>{if(signal.aborted)throw new DOMException('Aborted','AbortError');}}),{name:'AbortError'});
});

test('preflight aceita Range 206 e retry é limitado sem duplicar download bem-sucedido', async () => {
  let heads=0, ranges=0, downloads=0;
  const game={bootKey:'Gran Turismo.iso',format:'iso',files:[{key:'Gran Turismo.iso'}]};
  const result=await downloadPs1Content(game,{attempts:3,fetchImpl:async(_url,init={})=>{
    if(init.method==='HEAD'){heads++;return new Response(null,{status:503});}
    if(init.headers?.Range){ranges++;if(ranges===1)return new Response(null,{status:503});return new Response(new Uint8Array([0]),{status:206,headers:{'Content-Range':'bytes 0-0/4','Accept-Ranges':'bytes'}});}
    downloads++;return new Response(new Uint8Array(4),{headers:{'Content-Length':'4'}});
  }});
  assert.equal(heads,2); assert.equal(ranges,2); assert.equal(downloads,1); assert.equal(result.totalBytes,4); URL.revokeObjectURL(result.gameUrl);
});

test('distingue HTTP 404 e offline real', async () => {
  const game={bootKey:'missing.iso',format:'iso',files:[{key:'missing.iso'}]};
  await assert.rejects(downloadPs1Content(game,{fetchImpl:async(_url,init={})=>init.method==='HEAD'?new Response(null,{status:404}):new Response(null,{status:404})}),{code:'HTTP_404',status:404});
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  Object.defineProperty(globalThis,'navigator',{value:{onLine:false},configurable:true});
  await assert.rejects(downloadPs1Content(game,{fetchImpl:async()=>{throw new TypeError('Failed to fetch');}}),{code:'OFFLINE'});
  if(descriptor)Object.defineProperty(globalThis,'navigator',descriptor);else delete globalThis.navigator;
});
