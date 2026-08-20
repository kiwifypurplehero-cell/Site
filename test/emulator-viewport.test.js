import test from 'node:test';
import assert from 'node:assert/strict';
import {fitEmulatorViewport, readViewportSize} from '../emulator-viewport.js';

test('fits GBC into landscape without changing its aspect ratio', () => {
  assert.deepEqual(fitEmulatorViewport({availableWidth: 800, availableHeight: 360, nativeWidth: 160, nativeHeight: 144}), {width: 400, height: 360, scale: 2.5});
});

test('fits GBA into portrait without exceeding either edge', () => {
  assert.deepEqual(fitEmulatorViewport({availableWidth: 360, availableHeight: 600, nativeWidth: 240, nativeHeight: 160}), {width: 360, height: 240, scale: 1.5});
});

test('uses the core-provided PS1 framebuffer ratio', () => {
  assert.deepEqual(fitEmulatorViewport({availableWidth: 1000, availableHeight: 700, nativeWidth: 640, nativeHeight: 480}), {width: 933, height: 700, scale: 700 / 480});
});

test('centers GBC mathematically in a 1536x691 Android landscape viewport', () => {
  const fitted = fitEmulatorViewport({availableWidth: 1536, availableHeight: 691, nativeWidth: 160, nativeHeight: 144});
  assert.deepEqual(fitted, {width: 767, height: 691, scale: 691 / 144});
  assert.equal((1536 - fitted.width) / 2, 384.5);
});

test('prefers visualViewport dimensions after a mobile rotation', () => {
  assert.deepEqual(readViewportSize({innerWidth: 768, innerHeight: 691, visualViewport: {width: 1536, height: 691}}), {width: 1536, height: 691});
});
