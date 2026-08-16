import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('biblioteca abre o player PS1 dedicado em nova aba por gesto direto', () => {
  const source = fs.readFileSync(new URL('../emulators.js', import.meta.url), 'utf8');
  assert.match(source, /new URL\('\/play\/ps1\/', location\.origin\)/);
  assert.match(source, /window\.open\(url\.href, '_blank'\)/);
});

test('player PS1 preserva BIN+CUE, core leve e defaults seguros', () => {
  const source = fs.readFileSync(new URL('../ps1-player.js', import.meta.url), 'utf8');
  assert.match(source, /downloadPs1Archive/);
  assert.match(source, /EJS_core:'psx'/);
  assert.match(source, /EJS_threads:false/);
  assert.match(source, /pcsx_rearmed_drc: 'enabled'/);
  assert.match(source, /pcsx_rearmed_duping_enable/);
  assert.match(source, /pcsx_rearmed_neon_enhancement_enable: 'disabled'/);
});

test('página dedicada não carrega scripts gerais da PlumpGames', () => {
  const html = fs.readFileSync(new URL('../ps1-player.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /script\.js|emulators\.js|accessibility\.js|PJ Assistant/i);
  assert.match(html, /ps1-player\.js/);
});
