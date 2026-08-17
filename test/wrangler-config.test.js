import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('wrangler preserva variáveis públicas de PS1, PS2 e GBC', async () => {
  const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));

  assert.equal(config.keep_vars, true);
  assert.deepEqual(
    {
      endpoint: config.vars.B2_GBC_ENDPOINT,
      bucket: config.vars.B2_GBC_BUCKET,
      prefix: config.vars.B2_GBC_PREFIX
    },
    {
      endpoint: 'https://s3.us-east-005.backblazeb2.com',
      bucket: 'plumpgames-storage-ps1',
      prefix: 'Jogos-GBC/'
    }
  );
  assert.equal(config.vars.B2_PS1_PREFIX, 'Jogos/');
  assert.equal(config.vars.B2_PS2_PREFIX, 'ps2/jogos/');
});

test('wrangler não versiona chaves secretas do Backblaze', async () => {
  const source = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  for (const secret of [
    'B2_GBC_ACCESS_KEY_ID',
    'B2_GBC_SECRET_ACCESS_KEY',
    'B2_PS1_ACCESS_KEY_ID',
    'B2_PS1_SECRET_ACCESS_KEY'
  ]) assert.doesNotMatch(source, new RegExp(`"${secret}"\\s*:`));
});
