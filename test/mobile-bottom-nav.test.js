import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../style.css', import.meta.url), 'utf8');
const router = await readFile(new URL('../app-router.js', import.meta.url), 'utf8');

test('bottom navigation is a global sibling after the app shell', () => {
  assert.match(html, /<\/div>\s*<!-- Global viewport chrome:[\s\S]*?<nav id="mobile-bottom-nav"/);
  const mainEnd = html.indexOf('</main>');
  const shellEnd = html.indexOf('<!-- Global viewport chrome:');
  const nav = html.indexOf('<nav id="mobile-bottom-nav"');
  assert.ok(mainEnd < shellEnd && shellEnd < nav);
  assert.equal((html.match(/id="mobile-bottom-nav"/g) || []).length, 1);
});

test('mobile navigation is fixed to the visual viewport with safe spacing', () => {
  assert.match(css, /#mobile-bottom-nav\{position:fixed;z-index:9999/);
  assert.match(css, /bottom:calc\(8px \+ var\(--bottom-safe-offset\)\)/);
  assert.match(css, /--bottom-safe-offset:env\(safe-area-inset-bottom,0px\)/);
  assert.match(css, /#main-content\{[^}]*padding-bottom:calc\(90px \+ var\(--bottom-safe-offset\)\)/);
  assert.doesNotMatch(css, /#mobile-bottom-nav\{[^}]*position:absolute/);
});

test('keyboard and fullscreen states hide the global navigation', () => {
  assert.match(router, /visualViewport\.height/);
  assert.match(router, /visualViewport\.offsetTop/);
  assert.match(css, /html\.keyboard-open #mobile-bottom-nav\{display:none\}/);
  assert.match(css, /html\.app-fullscreen #mobile-bottom-nav\{display:none!important\}/);
});
