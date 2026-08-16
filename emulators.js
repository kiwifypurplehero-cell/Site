import {findEmulator} from './emulator-registry.js';

const VALID_VIEWS = new Set(['home', 'emulators', 'ps1', 'ps2']);
const VIEW_TITLES = {
  home: 'PlumpGames — Jogos gratuitos e projetos independentes',
  emulators: 'Emuladores — PlumpGames',
  ps1: 'PlayStation 1 — PlumpGames',
  ps2: 'PlayStation 2 — PlumpGames'
};
const appViewState = {currentView: 'home', homeScrollY: 0};
export const PS1EmulatorState = {coreReady: false, selectedGame: null, running: false, loading: false, error: null};
const EMULATORJS_DATA = 'https://cdn.emulatorjs.org/stable/data/';
let ps1LibraryPromise;
let biosObjectUrl;
let libraryPromise;

function requestedView() {
  const view = new URL(location.href).searchParams.get('view') || 'home';
  return VALID_VIEWS.has(view) ? view : 'home';
}

function viewUrl(view) {
  const url = new URL(location.href);
  if (view === 'home') url.searchParams.delete('view');
  else url.searchParams.set('view', view);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function setView(view, {historyMode = 'push'} = {}) {
  if (!VALID_VIEWS.has(view)) view = 'home';
  const previousView = appViewState.currentView;
  if (previousView === 'home' && view !== 'home') appViewState.homeScrollY = scrollY;

  document.querySelectorAll('[data-app-view]').forEach(section => {
    const active = section.dataset.appView === view;
    section.hidden = !active;
    section.setAttribute('aria-hidden', String(!active));
  });
  document.querySelectorAll('[data-view-link]').forEach(control => {
    const active = control.dataset.viewLink === view || ((view === 'ps2' || view === 'ps1') && control.dataset.viewLink === 'emulators');
    if (active) control.setAttribute('aria-current', 'page');
    else control.removeAttribute('aria-current');
  });

  appViewState.currentView = view;
  document.title = VIEW_TITLES[view];
  if (historyMode === 'push' && requestedView() !== view) history.pushState({view}, '', viewUrl(view));
  else if (historyMode === 'replace') history.replaceState({view}, '', viewUrl(view));

  if (view === 'ps2') loadLibrary();
  if (view === 'ps1') loadPs1Library();
  requestAnimationFrame(() => scrollTo({top: view === 'home' ? appViewState.homeScrollY : 0, behavior: 'auto'}));
}

async function loadLibrary() {
  if (libraryPromise) return libraryPromise;
  const romList = document.querySelector('#rom-list');
  const gamesStatus = document.querySelector('#games-status');
  if (!romList || !gamesStatus) return;
  libraryPromise = (async () => {
    try {
      const response = await fetch('/api/emulators/ps2/games');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Não foi possível carregar a biblioteca.');
      gamesStatus.textContent = payload.games.length ? `${payload.games.length} jogo(s) encontrado(s).` : 'Nenhum jogo publicado ainda.';
      romList.replaceChildren(...payload.games.map(createGameCard));
    } catch (error) {
      gamesStatus.textContent = error.message || 'Não foi possível carregar a biblioteca.';
      libraryPromise = undefined;
    }
  })();
  return libraryPromise;
}

function createGameCard(game) {
  const emulator = findEmulator('ps2');
  const row = document.createElement('article');
  row.className = 'rom-card';
  const details = document.createElement('div');
  const title = document.createElement('strong');
  const metadata = document.createElement('small');
  const button = document.createElement('button');
  title.textContent = game.title;
  metadata.textContent = `${game.format} · ${Math.ceil(game.size / 1048576)} MiB`;
  button.className = 'button button--play';
  button.type = 'button';
  button.textContent = 'Selecionar';
  button.addEventListener('click', () => {
    document.querySelector('#selected-game').textContent = game.title;
    const start = document.querySelector('#start-emulator');
    start.disabled = emulator.core.status === 'pending';
    start.textContent = emulator.core.status === 'pending' ? 'Núcleo em integração' : 'Iniciar';
  });
  details.append(title, metadata);
  row.append(details, button);
  return row;
}


function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Tamanho desconhecido';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KiB', 'MiB', 'GiB', 'TiB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length);
  return `${(bytes / 1024 ** exponent).toLocaleString('pt-BR', {maximumFractionDigits: 1})} ${units[exponent - 1]}`;
}

async function loadPs1Library() {
  if (ps1LibraryPromise) return ps1LibraryPromise;
  const status = document.querySelector('#ps1-games-status');
  const list = document.querySelector('#ps1-rom-list');
  if (!status || !list) return;
  status.textContent = 'Carregando biblioteca PS1...';
  ps1LibraryPromise = (async () => {
    try {
      const response = await fetch('/api/emulators/ps1/games');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `A biblioteca respondeu ${response.status}.`);
      status.textContent = payload.games.length ? `${payload.games.length} jogo(s) encontrado(s).` : 'Nenhum jogo PS1 publicado ainda.';
      list.replaceChildren(...payload.games.map(game => {
        const card = document.createElement('article'); card.className = 'rom-card';
        const details = document.createElement('div');
        const title = document.createElement('strong'); title.textContent = game.name;
        const metadata = document.createElement('small'); metadata.textContent = `${game.format.toUpperCase()} · ${formatBytes(game.size)}`;
        const play = document.createElement('button'); play.className = 'button button--play'; play.type = 'button'; play.textContent = 'Jogar';
        play.addEventListener('click', () => startPs1(game)); details.append(title, metadata); card.append(details, play); return card;
      }));
    } catch (error) {
      status.textContent = error.message || 'Biblioteca temporariamente indisponível.';
      ps1LibraryPromise = undefined;
    }
  })();
  return ps1LibraryPromise;
}

function ps1StreamUrl(game) {
  return `/api/emulators/ps1/file/${game.key.split('/').map(encodeURIComponent).join('/')}`;
}

function setPs1Loading(message) {
  const loading = document.querySelector('#ps1-loading');
  PS1EmulatorState.loading = Boolean(message);
  loading.hidden = !message; loading.textContent = message || '';
}

function failPs1(error) {
  PS1EmulatorState.error = error instanceof Error ? error.message : String(error);
  PS1EmulatorState.running = false; setPs1Loading('');
  const box = document.querySelector('#ps1-error'); box.textContent = PS1EmulatorState.error; box.hidden = false;
  document.querySelector('#ps1-retry').hidden = false;
}

function clearEmulatorGlobals() {
  for (const key of Object.keys(window)) if (key.startsWith('EJS_')) try { delete window[key]; } catch {}
}

function stopPs1({showLibrary = true} = {}) {
  try { window.EJS_emulator?.gameManager?.saveState?.(); } catch {}
  try { window.EJS_emulator?.stop?.(); } catch {}
  document.querySelector('#ps1-emulator')?.replaceChildren();
  document.querySelectorAll('script[data-emulatorjs-loader]').forEach(node => node.remove());
  clearEmulatorGlobals();
  Object.assign(PS1EmulatorState, {coreReady: false, selectedGame: null, running: false, loading: false, error: null});
  document.querySelector('#ps1-player-panel').hidden = true;
  document.querySelector('#ps1-library').hidden = !showLibrary;
}

function startPs1(game) {
  stopPs1({showLibrary: false});
  Object.assign(PS1EmulatorState, {selectedGame: game, loading: true, error: null});
  const panel = document.querySelector('#ps1-player-panel'); panel.hidden = false;
  const errorBox = document.querySelector('#ps1-error'); errorBox.hidden = true;
  document.querySelector('#ps1-retry').hidden = true;
  setPs1Loading('Preparando emulador...');
  window.EJS_player = '#ps1-emulator';
  window.EJS_core = document.querySelector('#ps1-core').value || 'psx';
  window.EJS_gameUrl = ps1StreamUrl(game);
  window.EJS_pathtodata = EMULATORJS_DATA;
  window.EJS_startOnLoaded = true;
  window.EJS_gameName = game.name;
  window.EJS_biosUrl = biosObjectUrl || undefined;
  window.EJS_onGameStart = () => {
    Object.assign(PS1EmulatorState, {coreReady: true, running: true, loading: false, error: null});
    setPs1Loading('');
  };
  const loader = document.createElement('script'); loader.src = `${EMULATORJS_DATA}loader.js`; loader.dataset.emulatorjsLoader = 'true';
  loader.onload = () => { if (PS1EmulatorState.loading) setPs1Loading('Carregando jogo... Iniciando PlayStation...'); };
  loader.onerror = () => failPs1(new Error('Não foi possível carregar o loader estável do EmulatorJS. Verifique a conexão e tente novamente.'));
  document.head.append(loader);
  setTimeout(() => { if (PS1EmulatorState.loading && PS1EmulatorState.selectedGame === game) failPs1(new Error('O emulador não iniciou. A imagem pode ser inválida, exigir CUE/BIN para trilhas de áudio ou uma BIOS do PlayStation legalmente obtida.')); }, 45000);
  panel.scrollIntoView({behavior: 'smooth', block: 'start'});
}

document.addEventListener('click', event => {
  const control = event.target.closest('[data-view-link]');
  if (!control) return;
  event.preventDefault();
  setView(control.dataset.viewLink);
});
window.addEventListener('popstate', () => setView(requestedView(), {historyMode: 'none'}));
document.querySelector('[data-ps1-back]')?.addEventListener('click', () => { stopPs1(); setView('emulators'); });
document.querySelector('[data-ps1-close]')?.addEventListener('click', () => stopPs1());
document.querySelector('#ps1-retry')?.addEventListener('click', () => PS1EmulatorState.selectedGame && startPs1(PS1EmulatorState.selectedGame));
document.querySelector('#ps1-fullscreen')?.addEventListener('click', () => document.querySelector('#ps1-player-panel')?.requestFullscreen?.());
document.querySelector('#ps1-restart')?.addEventListener('click', () => { try { window.EJS_emulator?.restart?.(); } catch (error) { failPs1(error); } });
document.querySelector('#ps1-bios-file')?.addEventListener('change', event => { if (biosObjectUrl) URL.revokeObjectURL(biosObjectUrl); const file = event.target.files[0]; biosObjectUrl = file ? URL.createObjectURL(file) : undefined; document.querySelector('#ps1-bios-status').textContent = file ? `BIOS local selecionada: ${file.name}` : 'Nenhuma BIOS selecionada.'; });
document.querySelector('#fullscreen-emulator')?.addEventListener('click', () => document.querySelector('.emulator-viewport')?.requestFullscreen?.());
setView(requestedView(), {historyMode: 'replace'});

export {appViewState};
