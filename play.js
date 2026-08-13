'use strict';

const OWNER = 'kiwifypurplehero-cell';
const KNOWN_GAMES = Object.freeze({
  fnf: { repo:'FNF', name:'FNF', url:'https://kiwifypurplehero-cell.github.io/FNF/' },
  'cs1-6html': { repo:'CS1-6HTML', name:'CS 1.6 PLH', url:'https://kiwifypurplehero-cell.github.io/CS1-6HTML/' }
});
const FIXED_RESOLUTIONS = ['1920x1080','1600x900','1366x768','1280x720','1280x1024','1280x960','1024x768','800x600','640x480'];
const params = new URLSearchParams(location.search);
const requestedRepo = (params.get('repo') || '').trim();

function getGamePlayUrl(game) {
  const repo = String(game?.repo || '').trim();
  const known = KNOWN_GAMES[repo.toLowerCase()];
  if (known) return known.url;
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(repo)) return '';
  const candidate = new URL(`https://${OWNER}.github.io/${encodeURIComponent(repo)}/`);
  return candidate.protocol === 'https:' && candidate.hostname === `${OWNER}.github.io` ? candidate.href : '';
}

const knownGame = KNOWN_GAMES[requestedRepo.toLowerCase()];
const game = { repo:knownGame?.repo || requestedRepo, name:knownGame?.name || (params.get('name') || requestedRepo || 'Jogo').slice(0,100) };
const playUrl = getGamePlayUrl(game);
const frame = document.querySelector('#game-frame');
const stage = document.querySelector('#game-stage');
const area = document.querySelector('#game-area');
const menu = document.querySelector('#resolution-menu');
const shield = document.querySelector('#menu-shield');
let resolution = 'auto';
let custom = { width:1280, height:720 };
let loadTimer;
let messageTimer;

document.querySelector('#game-name').textContent = game.name;
frame.title = game.name;
document.title = `${game.name} — PlumpGames`;
document.querySelector('#direct').href = playUrl || '#';

function showMessage(text) {
  const message = document.querySelector('#message');
  clearTimeout(messageTimer); message.textContent = text; message.hidden = false;
  messageTimer = setTimeout(() => { message.hidden = true; }, 4500);
}

function availableSize() {
  const box = area.getBoundingClientRect();
  return { width:Math.max(1,Math.round(box.width)), height:Math.max(1,Math.round(box.height)) };
}

function applyResolution() {
  const available = availableSize();
  if (resolution === 'auto' || resolution === 'current') {
    Object.assign(stage.style, { width:'100%', height:'100%', transform:'translate(-50%,-50%)' });
  } else {
    const target = resolution === 'custom' ? custom : (() => { const [width,height] = resolution.split('x').map(Number); return {width,height}; })();
    const scale = Math.min(available.width / target.width, available.height / target.height);
    Object.assign(stage.style, { width:`${target.width}px`, height:`${target.height}px`, transform:`translate(-50%,-50%) scale(${scale})` });
  }
  renderResolutionMenu();
}

function resolutionOption(value, label) {
  return `<button type="button" role="menuitemradio" data-resolution="${value}" aria-checked="${resolution === value}">${label}</button>`;
}

function renderResolutionMenu() {
  const size = availableSize();
  menu.innerHTML = resolutionOption('auto','Automático / Ajustado') + resolutionOption('current',`Resolução atual — ${size.width} × ${size.height}`) + FIXED_RESOLUTIONS.map(value => resolutionOption(value,value.replace('x',' × '))).join('') + resolutionOption('custom','Personalizado') + (resolution === 'custom' ? `<form class="custom-fields"><label>Largura<input name="width" type="number" min="320" max="7680" required value="${custom.width}"></label><label>Altura<input name="height" type="number" min="240" max="4320" required value="${custom.height}"></label><button type="submit">Aplicar</button></form>` : '');
}

function setMenu(open) {
  menu.hidden = !open; shield.hidden = !open;
  document.querySelector('#resolution').setAttribute('aria-expanded', String(open));
  if (open) { renderResolutionMenu(); menu.querySelector('button')?.focus(); }
}

function loadGame() {
  clearTimeout(loadTimer);
  document.querySelector('#loading').hidden = false; document.querySelector('#error').hidden = true;
  if (!playUrl) { showLoadError(); return; }
  frame.src = 'about:blank';
  requestAnimationFrame(() => { frame.src = playUrl; loadTimer = setTimeout(showLoadError, 20000); });
}

function showLoadError() {
  clearTimeout(loadTimer); document.querySelector('#loading').hidden = true; document.querySelector('#error').hidden = false;
}

frame.addEventListener('load', () => {
  if (frame.src === 'about:blank') return;
  clearTimeout(loadTimer); document.querySelector('#loading').hidden = true; document.querySelector('#error').hidden = true;
});
document.querySelector('#resolution').addEventListener('click', () => setMenu(menu.hidden));
menu.addEventListener('click', event => { const button = event.target.closest('[data-resolution]'); if (!button) return; resolution = button.dataset.resolution; applyResolution(); if (resolution !== 'custom') setMenu(false); });
menu.addEventListener('submit', event => { event.preventDefault(); const data = new FormData(event.target); const width = Number(data.get('width')); const height = Number(data.get('height')); if (!Number.isInteger(width) || !Number.isInteger(height) || width < 320 || width > 7680 || height < 240 || height > 4320) { showMessage('Use valores entre 320 × 240 e 7680 × 4320.'); return; } custom = {width,height}; applyResolution(); setMenu(false); });
shield.addEventListener('click', () => { setMenu(false); frame.focus(); });
document.addEventListener('pointerdown', event => { if (!menu.hidden && !event.target.closest('.resolution-control') && event.target !== shield) setMenu(false); });
document.querySelector('#restart').addEventListener('click', loadGame);
document.querySelector('#retry').addEventListener('click', loadGame);
document.querySelector('#fullscreen').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else throw new Error('unsupported'); } catch { showMessage('Tela cheia não está disponível neste navegador.'); } });
document.addEventListener('fullscreenchange', applyResolution);
document.querySelector('#close').addEventListener('click', () => { window.close(); setTimeout(() => { if (!window.closed) showMessage('Você pode fechar esta aba pelo navegador.'); }, 150); });
window.addEventListener('resize', applyResolution);
window.addEventListener('orientationchange', applyResolution);
window.visualViewport?.addEventListener('resize', applyResolution);

renderResolutionMenu(); applyResolution(); loadGame();
