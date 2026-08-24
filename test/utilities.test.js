import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../style.css', import.meta.url), 'utf8');
const js = await readFile(new URL('../utilities.js', import.meta.url), 'utf8');
const router = await readFile(new URL('../app-router.js', import.meta.url), 'utf8');

test('Utilidades integra a navegação e a ordem direcional do router', () => {
  assert.match(html, /data-view-link="emulators"[\s\S]*data-view-link="utilities"[\s\S]*data-view-link="profile"/);
  assert.match(html, /data-app-view="utilities"/);
  assert.match(router, /\['workspace', 'emulators', 'utilities', 'profile'\]/);
});

test('detalhes montam vídeo sob demanda sem autoplay e o removem ao voltar', () => {
  assert.doesNotMatch(html, /youtube\.com\/embed\/PvCY7-ivAOU/);
  assert.match(js, /details\.innerHTML = detailsMarkup\(\)/);
  assert.match(js, /src="https:\/\/www\.youtube\.com\/embed\/PvCY7-ivAOU"/);
  assert.doesNotMatch(js, /[?&]autoplay=1/);
  assert.match(js, /details\.replaceChildren\(\)/);
  assert.match(css, /\.utility-video\{[^}]*aspect-ratio:16\/9/);
});

test('bookmarklet oferece instalação desktop, cópia mobile e transparência', () => {
  assert.match(js, /const BOOKMARKLET = "javascript:/);
  assert.match(js, /navigator\.clipboard\.writeText\(BOOKMARKLET\)/);
  assert.match(js, /Ver código-fonte/);
  assert.match(css, /\.bookmarklet-copy,.mobile-instructions\{display:none\}/);
  assert.match(css, /@media\(max-width:767px\)[\s\S]*\.bookmarklet-copy,.mobile-instructions\{display:inline-flex\}/);
});
