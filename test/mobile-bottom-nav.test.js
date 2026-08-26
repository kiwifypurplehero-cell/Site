import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../style.css', import.meta.url), 'utf8');
const mobileCss = await readFile(new URL('../assets/css/responsive/mobile.css', import.meta.url), 'utf8');

test('mobile mantém as quatro views e o menu na barra superior', () => {
  const navigation = html.match(/<nav class="navbar container"[\s\S]*?<\/nav>/)?.[0] || '';
  const labels = [...navigation.matchAll(/<b>([^<]+)<\/b>/g)].map(match => match[1]);
  assert.deepEqual(labels, ['Home', 'Emuladores', 'Utilidades', 'Perfil']);
  assert.match(navigation, /id="gx-menu-button"/);
  assert.doesNotMatch(html, /id="mobile-bottom-nav"/);
});

test('navegação superior cabe no viewport móvel sem esconder Utilidades', () => {
  assert.match(css, /\.site-header \.primary-nav\{display:flex!important/);
  assert.match(css, /\.site-header \.primary-nav\{min-width:0;flex:1;justify-content:center;gap:clamp\(8px,3\.5vw,22px\)/);
  assert.match(mobileCss, /justify-content:\s*center;\s*gap:\s*clamp\(8px, 3\.5vw, 22px\)/);
  assert.doesNotMatch(mobileCss, /justify-content:\s*space-(?:between|around|evenly)/);
  assert.match(css, /\.gx-menu-button\{flex:0 0 34px/);
});
