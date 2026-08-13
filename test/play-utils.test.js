'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  FIXED_RESOLUTIONS,
  buildPlayPageUrl,
  fitResolution,
  getGamePlayUrl,
  parseResolution,
  validCustomResolution
} = require('../play-utils.js');

test('resolve os jogos conhecidos somente no GitHub Pages autorizado', () => {
  assert.equal(getGamePlayUrl({ repo:'FNF' }), 'https://kiwifypurplehero-cell.github.io/FNF/');
  assert.equal(getGamePlayUrl({ repo:'CS1-6HTML' }), 'https://kiwifypurplehero-cell.github.io/CS1-6HTML/');
  assert.equal(getGamePlayUrl({ repo:'Novo-Jogo' }), 'https://kiwifypurplehero-cell.github.io/Novo-Jogo/');
});

test('rejeita tentativas de injetar URL, host, caminho ou protocolo', () => {
  for (const repo of [
    'https://example.com/game', '//example.com', '../admin', 'game/path',
    'game?x=1', 'game#frame', '.', '..', '', 'a'.repeat(101)
  ]) assert.equal(getGamePlayUrl({ repo }), '', repo);
});

test('cria URL absoluta da página dedicada com parâmetros codificados', () => {
  const result = new URL(buildPlayPageUrl(
    { rawName:'FNF', name:'Friday Night Funkin & amigos' },
    'https://site.kiwifypurplehero.workers.dev/catalogo/'
  ));
  assert.equal(result.origin, 'https://site.kiwifypurplehero.workers.dev');
  assert.equal(result.pathname, '/play.html');
  assert.equal(result.searchParams.get('repo'), 'FNF');
  assert.equal(result.searchParams.get('name'), 'Friday Night Funkin & amigos');
});

test('oferece exatamente todas as resoluções fixas solicitadas', () => {
  assert.deepEqual(FIXED_RESOLUTIONS, [
    '1920x1080', '1600x900', '1366x768', '1280x720', '1280x1024',
    '1280x960', '1024x768', '800x600', '640x480'
  ]);
  for (const value of FIXED_RESOLUTIONS) assert.ok(parseResolution(value));
});

test('escala cada viewport fixa sem distorcer em desktop e mobile', () => {
  const viewports = [
    [1920, 1000], // desktop
    [393, 780],   // mobile portrait
    [780, 393]    // mobile landscape
  ];
  for (const [availableWidth, availableHeight] of viewports) {
    for (const value of ['1920x1080', '1280x720', '1024x768', '800x600', '640x480']) {
      const target = parseResolution(value);
      const fitted = fitResolution(availableWidth, availableHeight, target.width, target.height);
      assert.equal(fitted.scale, Math.min(availableWidth / target.width, availableHeight / target.height));
      assert.ok(fitted.width * fitted.scale <= availableWidth + Number.EPSILON * target.width);
      assert.ok(fitted.height * fitted.scale <= availableHeight + Number.EPSILON * target.height);
    }
  }
});

test('valida resolução personalizada e bloqueia valores absurdos', () => {
  assert.equal(validCustomResolution(320, 240), true);
  assert.equal(validCustomResolution(1920, 1080), true);
  assert.equal(validCustomResolution(7680, 4320), true);
  assert.equal(validCustomResolution(319, 240), false);
  assert.equal(validCustomResolution(7681, 4320), false);
  assert.equal(validCustomResolution(1280.5, 720), false);
  assert.equal(validCustomResolution(Infinity, 720), false);
});

test('a implementação ativa não contém launcher ou controle virtual legado', () => {
  const root = path.join(__dirname, '..');
  const activeFiles = ['index.html', 'script.js', 'style.css', 'play.html', 'play.js', 'play.css'];
  const source = activeFiles.map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
  assert.doesNotMatch(source, /game-launcher|virtual-gamepad|gamepad-button|launcher-popover|iframe-interaction-overlay/i);
  assert.doesNotMatch(source, /dispatchVirtualKey|VIRTUAL_GAMEPAD_MAPPING|openGameLauncher|closeGameLauncher/i);
});

test('a barra dedicada contém somente a engrenagem e o menu completo', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'play.html'), 'utf8');
  const toolbar = html.match(/<header class="play-toolbar">([\s\S]*?)<\/header>/)?.[1] || '';
  const ids = [...toolbar.matchAll(/<button id="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(ids, ['game-settings-button']);
  assert.match(toolbar, /aria-label="Configurações do jogo"/);
  assert.match(toolbar, /aria-controls="game-settings-menu"/);
  assert.match(html, /id="game-settings-menu"/);
  for (const option of ['Tela cheia', 'Resolução', 'Reiniciar', 'Loadouts', 'Fechar']) assert.match(html, new RegExp(`>${option}`));
  assert.match(html, /id="game-stage"/);
  assert.match(html, /id="game-resolution-frame"/);
  assert.match(html, /Carregando jogo\.\.\./);
  assert.match(html, /Tentar novamente/);
  assert.match(html, /Abrir jogo diretamente/);
});

test('loadouts são persistidos por jogo sem tentar acessar o documento do iframe', () => {
  const script = fs.readFileSync(path.join(__dirname, '..', 'play.js'), 'utf8');
  assert.match(script, /plumpgamesLoadouts/);
  assert.match(script, /const gameDisplayState = \{ mode:'auto'/);
  assert.doesNotMatch(script, /contentDocument|contentWindow|dispatchEvent\(/);
  for (const action of ['Cima','Baixo','Esquerda','Direita','Pular','Ação principal','Pausar','Confirmar','Voltar']) assert.match(script, new RegExp(action));
  for (const button of ['△ Triângulo','○ Círculo','× X','□ Quadrado','Touchpad Press']) assert.match(script, new RegExp(button));
});
