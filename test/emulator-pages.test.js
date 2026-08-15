import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../worker.js';

const root = new URL('../', import.meta.url);
const contentTypes = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8'};

async function assetFetch(request) {
  const pathname = new URL(request.url).pathname;
  const file = pathname === '/' ? 'index.html' : pathname.slice(1);
  try {
    const body = await readFile(new URL(file, root));
    const extension = file.slice(file.lastIndexOf('.'));
    return new Response(body, {headers: {'Content-Type': contentTypes[extension] || 'application/octet-stream'}});
  } catch {
    return new Response('Not found', {status: 404});
  }
}

const env = {ASSETS: {fetch: assetFetch}};
const request = path => worker.fetch(new Request(`https://local.test${path}`, {headers: {Accept: 'text/html'}}), env);

test('home expõe a navegação de emuladores no rodapé', async () => {
  const response = await request('/');
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /class="footer-primary-nav"/);
  assert.match(html, /href="\/emulators\.html">Emuladores/);
});

test('catálogo e alias exibem o PS2 e apontam para uma rota existente', async () => {
  for (const path of ['/emulators.html', '/emulators/']) {
    const response = await request(path);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /PlayStation 2/);
    assert.match(html, /href="\/emulators\/ps2\/">Abrir emulador/);
  }
  assert.equal((await request('/emulators/ps2/')).status, 200);
});

test('assets usados pela área PS2 existem', async () => {
  for (const path of ['/style.css', '/emulators.js', '/emulator-registry.js']) {
    assert.equal((await request(path)).status, 200, path);
  }
});
