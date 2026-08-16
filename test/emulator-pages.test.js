import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../worker.js';

const root = new URL('../', import.meta.url);
const contentTypes = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8'};
async function assetFetch(request) {
  const pathname = new URL(request.url).pathname;
  const file = pathname === '/' ? 'index.html' : pathname.slice(1);
  try { return new Response(await readFile(new URL(file, root)), {headers: {'Content-Type': contentTypes[file.slice(file.lastIndexOf('.'))] || 'application/octet-stream'}}); }
  catch { return new Response('Not found', {status: 404}); }
}
const env = {ASSETS: {fetch: assetFetch}};
const request = path => worker.fetch(new Request(`https://local.test${path}`, {headers: {Accept: 'text/html'}}), env);

test('home contém as três views e navegação interna', async () => {
  const response = await request('/');
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const view of ['home', 'emulators', 'ps1', 'ps2']) assert.match(html, new RegExp(`data-app-view="${view}"`));
  assert.match(html, /data-view-link="emulators"/);
  assert.match(html, /data-view-link="ps1">Abrir emulador/);
  assert.match(html, /data-view-link="ps2">Abrir emulador/);
  assert.match(html, /data-view-link="emulators">← Voltar/);
  assert.doesNotMatch(html, /target="_blank"|href="\/emulators\.html"|href="\/emulators\/ps2\/"/);
});

test('controlador troca views via estado e preserva History API', async () => {
  const source = await readFile(new URL('../emulators.js', import.meta.url), 'utf8');
  assert.match(source, /appViewState = \{currentView: 'home'/);
  assert.match(source, /function setView\(view/);
  assert.match(source, /history\.pushState/);
  assert.match(source, /addEventListener\('popstate'/);
  assert.doesNotMatch(source, /window\.open|location\.href\s*=/);
});

test('PS2 mantém endpoint seguro e integração declarada com B2', async () => {
  const [source, registry] = await Promise.all([
    readFile(new URL('../emulators.js', import.meta.url), 'utf8'),
    readFile(new URL('../emulator-registry.js', import.meta.url), 'utf8')
  ]);
  assert.match(source, /fetch\('\/api\/emulators\/ps2\/games'\)/);
  assert.match(registry, /Backblaze B2/);
});

test('PS1 envia ISO ao pcsx_rearmed/HLE sem exigir BIOS nem pré-bloquear a extensão', async () => {
  const [html, source, registry] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../emulators.js', import.meta.url), 'utf8'),
    readFile(new URL('../emulator-registry.js', import.meta.url), 'utf8')
  ]);
  assert.match(source, /EJS_core = document\.querySelector\('#ps1-core'\)\.value \|\| 'psx'/);
  assert.match(source, /biosMode: 'hle'/);
  assert.doesNotMatch(source, /window\.EJS_biosUrl = biosObjectUrl \|\| undefined/);
  assert.doesNotMatch(source, /coreExtensions\.includes|não anuncia suporte direto a ISO/);
  assert.match(registry, /coreExtensions: Object\.freeze\(\['iso', 'bin', 'cue', 'chd'/);
  assert.match(source, /fetch\(gameUrl, \{method: 'HEAD'/);
  assert.match(source, /window\.EJS_gameUrl = gameUrl/);
  for (const state of ['Preparando emulador', 'Conectando ao arquivo', 'Carregando jogo', 'Inicializando core', 'Executando']) assert.match(source, new RegExp(state));
  assert.match(html, /Automático\/HLE/);
  assert.match(html, /Executando sem BIOS externa\. Alguns jogos podem ter compatibilidade reduzida\./);
});
