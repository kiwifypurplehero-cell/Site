import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [worker, html, communityScript, uiScript] = await Promise.all([
  readFile(new URL('../worker.js', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../modules/community/community.js', import.meta.url), 'utf8'),
  readFile(new URL('../modules/ui/ui.js', import.meta.url), 'utf8')
]);

test('expõe catálogo comunitário persistente pelo Worker e D1', () => {
  assert.match(worker, /url\.pathname==='\/api\/community-games'/);
  assert.match(worker, /env\.DB\.prepare/);
  assert.match(worker, /\.bind\(/);
  assert.doesNotMatch(communityScript, /localStorage\.setItem\([^\n]*community/i);
});

test('formulário público exige autoria e está somente no menu/modal', () => {
  for (const field of ['githubUrl', 'name', 'creator', 'gameType', 'description', 'platform', 'coverUrl', 'confirmed']) {
    assert.match(html, new RegExp(`name="${field}"`));
  }
  assert.match(html, /Os jogos enviados ficam públicos na PlumpGames/);
  assert.match(html, /não reivindica autoria de jogos da comunidade/);
});

test('renderização de dados comunitários usa criação segura de nós', () => {
  assert.match(uiScript, /community-creator/);
  assert.match(uiScript, /textContent/);
  assert.doesNotMatch(uiScript, /innerHTML\s*=.*(?:game\.name|game\.creator|game\.description)/);
});