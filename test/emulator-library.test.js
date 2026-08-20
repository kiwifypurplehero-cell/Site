import test from 'node:test';
import assert from 'node:assert/strict';
import {clearLibraryCache, fetchEmulatorLibrary, refreshLibraryButton} from '../emulator-library.js';

const response = games => ({ok: true, json: async () => ({games})});

test('force refresh bypasses local/browser caches and changes cache-bust query', async () => {
  clearLibraryCache('gbc');
  const calls = [];
  const fetchImpl = async (url, options) => { calls.push({url, options}); return response([{id: calls.length}]); };
  await fetchEmulatorLibrary('gbc', {fetchImpl, now: () => 100});
  const fresh = await fetchEmulatorLibrary('gbc', {forceRefresh: true, fetchImpl, now: () => 200});
  assert.equal(calls.length, 2);
  assert.match(calls[1].url, /\?refresh=200$/);
  assert.equal(calls[1].options.cache, 'no-store');
  assert.equal(calls[1].options.headers['Cache-Control'], 'no-cache');
  assert.equal(fresh.games[0].id, 2);
});

test('normal concurrent loads share one request', async () => {
  clearLibraryCache('gba');
  let calls = 0;
  const fetchImpl = async () => { calls += 1; await new Promise(resolve => setTimeout(resolve, 5)); return response([]); };
  await Promise.all([fetchEmulatorLibrary('gba', {fetchImpl}), fetchEmulatorLibrary('gba', {fetchImpl})]);
  assert.equal(calls, 1);
});

test('refresh button always returns to an actionable state after failure', async () => {
  const button = {disabled: false, textContent: 'Atualizar biblioteca'};
  await assert.rejects(refreshLibraryButton('ps1-test', button, async options => {
    assert.equal(options.forceRefresh, true);
    throw new Error('503');
  }));
  assert.equal(button.disabled, false);
  assert.equal(button.textContent, 'Tentar novamente');
});
