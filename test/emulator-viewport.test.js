import test from 'node:test';
import assert from 'node:assert/strict';
import {fitEmulatorViewport} from '../emulator-viewport.js';

test('fits GBC into landscape without changing its aspect ratio', () => {
  assert.deepEqual(fitEmulatorViewport({availableWidth: 800, availableHeight: 360, nativeWidth: 160, nativeHeight: 144}), {width: 400, height: 360, scale: 2.5});
});

test('fits GBA into portrait without exceeding either edge', () => {
  assert.deepEqual(fitEmulatorViewport({availableWidth: 360, availableHeight: 600, nativeWidth: 240, nativeHeight: 160}), {width: 360, height: 240, scale: 1.5});
});

test('uses the core-provided PS1 framebuffer ratio', () => {
  assert.deepEqual(fitEmulatorViewport({availableWidth: 1000, availableHeight: 700, nativeWidth: 640, nativeHeight: 480}), {width: 933, height: 700, scale: 700 / 480});
});
