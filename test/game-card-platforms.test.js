import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const script = await readFile(new URL('../script.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../style.css', import.meta.url), 'utf8');

test('shared game cover removes badges and prepares neutral platform indicators', () => {
  const coverComponent = script.match(/function createGameCover\(game\)[\s\S]*?\n}/)?.[0] || '';
  assert.doesNotMatch(coverComponent, /OFICIAL|game-cover__icon|className[^\n]*status/);
  assert.match(coverComponent, /Array\.isArray\(game\.platforms\)/);
  assert.match(coverComponent, /\['desktop','▣','PC'\],\['mobile','▯','Celular'\]/);
  assert.match(coverComponent, /if \(declaredPlatforms\.length && !supported\) return/);
  assert.match(coverComponent, /'unknown'/);
  assert.match(coverComponent, /game-cover__identity/);
  assert.match(coverComponent, /game-cover__monogram/);
  assert.match(css, /\.game-cover__platforms/);
  assert.match(css, /\.game-cover__platforms\{position:absolute;left:14px;top:14px[^}]*flex-direction:column/);
  assert.match(css, /\.game-cover::before,\.game-cover::after\{display:none\}/);
  assert.match(css, /\.game-cover__monogram,\.game-cover__title[^}]*background:none!important[^}]*box-shadow:none!important/);
  assert.doesNotMatch(script, /['"`]OFICIAL['"`]/);
});
