import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const loader = await readFile(new URL('../site-loader.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('loader global tem mínimo, progresso real limitado e fallback', () => {
  assert.match(loader, /MINIMUM_VISIBLE_TIME = 3000/);
  assert.match(loader, /Math\.max\(0, MINIMUM_VISIBLE_TIME -/);
  assert.match(loader, /Math\.min\(99, interpolated\)/);
  assert.match(loader, /renderProgress\(100\)/);
  assert.match(loader, /MAXIMUM_BOOT_TIME = 18000/);
  assert.match(loader, /Não foi possível carregar completamente a PlumpGames\./);
});

test('overlay é imediato, translúcido e o cleanup libera interação', () => {
  assert.match(html, /<body class="loading-active">/);
  assert.match(html, /background:rgba\(5,6,17,\.76\)/);
  assert.match(html, /Carregando PlumpGames\.\.\./);
  assert.doesNotMatch(html, /3 segundos|cronômetro|contagem regressiva/i);
  assert.match(loader, /classList\.remove\('loading-active'\)/);
  assert.match(loader, /overlay\?\.remove\(\)/);
});
