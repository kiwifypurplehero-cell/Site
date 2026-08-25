import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('responsive layout keeps one markup base and consistent breakpoints', () => {
  const shared = read('assets/css/responsive/shared.css');
  const mobile = read('assets/css/responsive/mobile.css');
  const desktop = read('assets/css/responsive/desktop.css');
  assert.match(shared, /min-width:\s*768px[\s\S]*max-width:\s*1023px/);
  assert.match(mobile, /max-width:\s*767px/);
  assert.match(desktop, /min-width:\s*1024px/);
  assert.match(desktop, /width:\s*min\(80vw,\s*var\(--shell-max\)\)/);
  assert.match(mobile, /width:\s*calc\(100% - 24px\)/);
  assert.doesNotMatch(`${shared}${mobile}${desktop}`, /\b(?:zoom|transform:\s*scale)\s*:/);
  assert.equal(read('index.html').includes('/assets/css/responsive/shared.css'), true);
});

test('device hint follows visual viewport, resize and orientation without user-agent', () => {
  const script = read('assets/js/responsive/device-layout.js');
  assert.match(script, /visualViewport\?\.width\s*\|\|\s*window\.innerWidth/);
  assert.match(script, /width < 768[\s\S]*width < 1024/);
  assert.match(script, /addEventListener\('resize'/);
  assert.match(script, /addEventListener\('orientationchange'/);
  assert.doesNotMatch(script, /userAgent|Android|iPhone|Windows/);
});
