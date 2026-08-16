import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fetchPs1Game, resolvePs1Launch} from '../ps1-utils.js';

test('biblioteca abre o player PS1 dedicado em nova aba por gesto direto', () => {
  const source = fs.readFileSync(new URL('../emulators.js', import.meta.url), 'utf8');
  assert.match(source, /new URL\('\/ps1-player', location\.origin\)/);
  assert.match(source, /searchParams\.set\('game', game\.id\)/);
  assert.match(source, /window\.open\(url\.href, '_blank'\)/);
});

test('player consulta novamente a API por id em refresh ou acesso direto', async () => {
  const calls = [];
  const fetchImpl = async url => { calls.push(url); return new Response(JSON.stringify({games: [{id: 'crash-bandicoot-pt-br', name: 'Crash Bandicoot (PT-BR)'}]})); };
  assert.equal((await fetchPs1Game('crash-bandicoot-pt-br', {fetchImpl})).game.name, 'Crash Bandicoot (PT-BR)');
  assert.equal((await fetchPs1Game('crash-bandicoot-pt-br', {fetchImpl})).game.id, 'crash-bandicoot-pt-br');
  assert.deepEqual(calls, ['/api/emulators/ps1/games', '/api/emulators/ps1/games']);
});

test('player diferencia id ausente, inexistente e API 503', async () => {
  await assert.rejects(fetchPs1Game('', {fetchImpl: async () => assert.fail('não deve consultar')}), {code: 'missing', message: 'Jogo não especificado'});
  await assert.rejects(fetchPs1Game('nao-existe', {fetchImpl: async () => new Response('{"games":[]}', {status: 200})}), {code: 'not-found', message: 'Jogo não encontrado'});
  await assert.rejects(fetchPs1Game('crash', {fetchImpl: async () => new Response('', {status: 503})}), {code: 'unavailable', message: 'Biblioteca temporariamente indisponível'});
});

test('Crash inicia pelo CUE com BIN e Gran Turismo continua em ISO', () => {
  const crash = resolvePs1Launch({bootKey: 'Jogos/Crash Bandicoot (PT-BR)/Crash Bandicoot (PT-BR).cue', format: 'cue+bin', files: [{key: 'Jogos/Crash Bandicoot (PT-BR)/Crash Bandicoot (PT-BR).cue'}, {key: 'Jogos/Crash Bandicoot (PT-BR)/Crash Bandicoot (PT-BR).bin'}]});
  const granTurismo = resolvePs1Launch({bootKey: 'Jogos/Gran Turismo.iso', format: 'iso', files: [{key: 'Jogos/Gran Turismo.iso'}]});
  assert.match(crash.bootUrl, /\.cue$/); assert.equal(crash.dependencies.length, 1);
  assert.match(granTurismo.bootUrl, /\.iso$/); assert.equal(granTurismo.dependencies.length, 0);
});

test('tentar novamente repete a consulta e voltar restaura a página principal', () => {
  const source = fs.readFileSync(new URL('../ps1-player.js', import.meta.url), 'utf8');
  assert.match(source, /\$\('#retry'\)\.onclick=start/);
  assert.match(source, /window\.opener\.focus\(\);window\.close\(\)/);
  assert.match(source, /location\.href='\/\?view=ps1'/);
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
