import {findEmulator} from './emulator-registry.js';

const VALID_VIEWS = new Set(['home', 'emulators', 'ps2']);
const VIEW_TITLES = {
  home: 'PlumpGames — Jogos gratuitos e projetos independentes',
  emulators: 'Emuladores — PlumpGames',
  ps2: 'PlayStation 2 — PlumpGames'
};
const appViewState = {currentView: 'home', homeScrollY: 0};
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
    const active = control.dataset.viewLink === view || (view === 'ps2' && control.dataset.viewLink === 'emulators');
    if (active) control.setAttribute('aria-current', 'page');
    else control.removeAttribute('aria-current');
  });

  appViewState.currentView = view;
  document.title = VIEW_TITLES[view];
  if (historyMode === 'push' && requestedView() !== view) history.pushState({view}, '', viewUrl(view));
  else if (historyMode === 'replace') history.replaceState({view}, '', viewUrl(view));

  if (view === 'ps2') loadLibrary();
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

document.addEventListener('click', event => {
  const control = event.target.closest('[data-view-link]');
  if (!control) return;
  event.preventDefault();
  setView(control.dataset.viewLink);
});
window.addEventListener('popstate', () => setView(requestedView(), {historyMode: 'none'}));
document.querySelector('#fullscreen-emulator')?.addEventListener('click', () => document.querySelector('.emulator-viewport')?.requestFullscreen?.());
setView(requestedView(), {historyMode: 'replace'});

export {appViewState};
