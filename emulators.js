import {findEmulator} from './emulator-registry.js';
import {fetchEmulatorLibrary, refreshLibraryButton, renderLibraryIncrementally} from './emulator-library.js';

const VALID_VIEWS = new Set(['home', 'emulators', 'ps1', 'gbc', 'gba']);
const VIEW_TITLES = {
  home: 'PlumpGames — Jogos gratuitos e projetos independentes',
  emulators: 'Emuladores — PlumpGames',
  ps1: 'PlayStation 1 — PlumpGames',
  gbc: 'Game Boy Color — PlumpGames',
  gba: 'Game Boy Advance — PlumpGames'
};
const appViewState = {currentView: 'home', homeScrollY: 0};
export const PS1EmulatorState = {libraryLoaded: false, selectedGame: null, instance: null, coreReady: false, running: false, loading: false, error: null, biosMode: 'hle'};
const EMULATORJS_DATA = 'https://cdn.emulatorjs.org/stable/data/';
let biosObjectUrl;
let libraryPromise;
let ps1Attempt = 0;
let ps1Timeout;
let ps1PerformanceObserver;
let ps1LayoutMutationObserver;
let ps1LayoutResizeObserver;
let ps1HeadController;
let ps1LoadingTimer;
let ps1GameObjectUrl;

function stopPs1LayoutDiagnostics() {
  ps1LayoutMutationObserver?.disconnect(); ps1LayoutMutationObserver = undefined;
  ps1LayoutResizeObserver?.disconnect(); ps1LayoutResizeObserver = undefined;
}

function startPs1LayoutDiagnostics(attempt) {
  stopPs1LayoutDiagnostics();
  const shell = document.querySelector('.ps1-emulator-shell');
  const player = document.querySelector('#ps1-emulator');
  if (!shell || !player) return;
  const heights = new WeakMap();
  const describe = element => element?.id ? `#${element.id}` : element?.className ? `.${String(element.className).trim().replace(/\s+/g, '.')}` : element?.tagName?.toLowerCase();
  const report = changed => {
    if (attempt !== ps1Attempt) return;
    const canvas = player.querySelector('canvas');
    const wrapper = player.querySelector('#game,.ejs_parent,.ejs_game') || player.firstElementChild;
    console.log('[PS1-LAYOUT]', {
      changed: describe(changed),
      playerHeight: player.getBoundingClientRect().height,
      canvasHeight: canvas?.getBoundingClientRect().height ?? 0,
      wrapperHeight: wrapper?.getBoundingClientRect().height ?? 0,
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight
    });
  };
  ps1LayoutResizeObserver = new ResizeObserver(entries => {
    for (const {target, contentRect} of entries) {
      if (heights.get(target) === contentRect.height) continue;
      heights.set(target, contentRect.height); report(target);
    }
  });
  const observeLayoutNodes = () => {
    [shell, player, ...player.querySelectorAll('#game,.ejs_parent,.ejs_game,canvas,iframe')].forEach(node => {
      if (!heights.has(node)) ps1LayoutResizeObserver.observe(node);
    });
  };
  ps1LayoutMutationObserver = new MutationObserver(mutations => {
    const added = mutations.flatMap(mutation => [...mutation.addedNodes]).filter(node => node.nodeType === Node.ELEMENT_NODE);
    if (added.length) console.log('[PS1-LAYOUT] elementos adicionados:', added.map(describe));
    observeLayoutNodes(); report(added[0] || player);
  });
  ps1LayoutMutationObserver.observe(player, {childList: true, subtree: true});
  observeLayoutNodes(); report(shell);
}

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
  document.dispatchEvent(new CustomEvent('plumpgames:before-view-change', {detail: {previousView, view}}));
  if (previousView === 'home' && view !== 'home') appViewState.homeScrollY = scrollY;

  document.querySelectorAll('[data-app-view]').forEach(section => {
    const active = section.dataset.appView === view;
    section.hidden = !active;
    section.setAttribute('aria-hidden', String(!active));
  });
  document.querySelectorAll('[data-view-link]').forEach(control => {
    const active = control.dataset.viewLink === view || ((view === 'gba' || view === 'ps1' || view === 'gbc') && control.dataset.viewLink === 'emulators');
    if (active) control.setAttribute('aria-current', 'page');
    else control.removeAttribute('aria-current');
  });

  appViewState.currentView = view;
  document.title = VIEW_TITLES[view];
  if (historyMode === 'push' && requestedView() !== view) history.pushState({view}, '', viewUrl(view));
  else if (historyMode === 'replace') history.replaceState({view}, '', viewUrl(view));

  if (view === 'ps1') loadPs1Library();
  if (view === 'gbc') loadGbcLibrary();
  if (view === 'gba') loadGbaLibrary();
  requestAnimationFrame(() => scrollTo({top: view === 'home' ? appViewState.homeScrollY : 0, behavior: 'auto'}));
}

function createPortableCard(system, game) {
  const card = document.createElement('article'); card.className = 'rom-card ps1-rom-card';
  const cover = game.coverUrl ? document.createElement('img') : document.createElement('div'); cover.className = 'ps1-rom-cover';
  if (game.coverUrl) { cover.src = game.coverUrl; cover.alt = `Capa de ${game.name}`; cover.loading = 'lazy'; cover.decoding = 'async'; }
  else { cover.textContent = system === 'gbc' ? 'G' : 'A'; cover.setAttribute('aria-label', `Capa padrão ${system.toUpperCase()}`); }
  const details = document.createElement('div'), title = document.createElement('strong'), metadata = document.createElement('small');
  title.textContent = game.name; metadata.textContent = `${game.format.toUpperCase()} · ${formatBytes(game.size)}`; details.append(title, metadata);
  const play = document.createElement('button'); play.className = 'button button--play'; play.type = 'button'; play.textContent = 'Jogar';
  play.dataset.playSystem = system; play.dataset.gameId = game.id;
  card.append(cover, details, play); return card;
}

async function loadPortableLibrary(system, {forceRefresh = false} = {}) {
  const status = document.querySelector(`#${system}-games-status`), list = document.querySelector(`#${system}-rom-list`);
  if (!status || !list) return;
  if (!forceRefresh && list.childElementCount) return;
  if (!forceRefresh) status.textContent = `Carregando biblioteca ${system.toUpperCase()}...`;
  try {
    const payload = await fetchEmulatorLibrary(system, {forceRefresh});
    await renderLibraryIncrementally(list, payload.games, game => createPortableCard(system, game));
    status.textContent = payload.games.length ? `${payload.games.length} jogo(s) encontrado(s).` : `Nenhum jogo ${system.toUpperCase()} publicado ainda.`;
    return payload;
  } catch (error) {
    status.textContent = forceRefresh ? 'Não foi possível atualizar a biblioteca.' : error.message;
    throw error;
  }
}
const loadGbcLibrary = options => loadPortableLibrary('gbc', options);
const loadGbaLibrary = options => loadPortableLibrary('gba', options);

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

async function loadPs1Library({forceRefresh = false} = {}) {
  const status = document.querySelector('#ps1-games-status'), list = document.querySelector('#ps1-rom-list');
  if (!status || !list) return;
  if (!forceRefresh && list.childElementCount) return;
  if (!forceRefresh) status.textContent = 'Carregando biblioteca PS1...';
  try {
    const payload = await fetchEmulatorLibrary('ps1', {forceRefresh});
    await renderLibraryIncrementally(list, payload.games, game => createPortableCard('ps1', game));
    PS1EmulatorState.libraryLoaded = true;
    status.textContent = payload.games.length ? `${payload.games.length} jogo(s) encontrado(s).` : 'Nenhum jogo PS1 publicado ainda.';
    return payload;
  } catch (error) {
    PS1EmulatorState.libraryLoaded = false;
    status.textContent = forceRefresh ? 'Não foi possível atualizar a biblioteca.' : error.message;
    throw error;
  }
}

function setPs1Loading(message) {
  const loading = document.querySelector('#ps1-loading');
  PS1EmulatorState.loading = Boolean(message);
  loading.hidden = !message; loading.textContent = message || '';
}

function setPs1Diagnostic(key, value) {
  const field = document.querySelector(`[data-debug="${key}"]`);
  if (field) field.textContent = value ?? '—';
}

function updateLoaderState(state) {
  setPs1Diagnostic('loader', state);
  setPs1Loading(state);
}

function failPs1(error) {
  PS1EmulatorState.error = error instanceof Error ? error.message : String(error);
  PS1EmulatorState.running = false; setPs1Loading('');
  clearTimeout(ps1Timeout);
  document.querySelector('#ps1-error-message').textContent = PS1EmulatorState.error;
  document.querySelector('#ps1-error').hidden = false;
}

function clearEmulatorGlobals() {
  for (const key of Object.keys(window)) if (key.startsWith('EJS_')) try { delete window[key]; } catch {}
}

function stopPs1({showLibrary = true} = {}) {
  ps1Attempt += 1;
  clearTimeout(ps1Timeout);
  clearTimeout(ps1LoadingTimer);
  ps1HeadController?.abort(); ps1HeadController = undefined;
  if (ps1GameObjectUrl) URL.revokeObjectURL(ps1GameObjectUrl); ps1GameObjectUrl = undefined;
  try { window.EJS_emulator?.gameManager?.saveState?.(); } catch {}
  try { window.EJS_emulator?.stop?.(); } catch {}
  document.querySelector('#ps1-emulator')?.replaceChildren();
  document.querySelectorAll('script[data-emulatorjs-loader]').forEach(node => node.remove());
  clearEmulatorGlobals();
  ps1PerformanceObserver?.disconnect(); ps1PerformanceObserver = undefined;
  stopPs1LayoutDiagnostics();
  Object.assign(PS1EmulatorState, {instance: null, coreReady: false, selectedGame: null, running: false, loading: false, error: null});
  document.querySelector('#ps1-player-panel').hidden = true;
  document.querySelector('#ps1-library').hidden = !showLibrary;
}

async function startPs1(game) {
  if (!game) return;
  // Never let loader.js attach a second EmulatorJS tree to a live container.
  if (PS1EmulatorState.instance || PS1EmulatorState.loading) console.warn('[PS1] descartando a instância anterior antes de iniciar outra');
  stopPs1({showLibrary: false});
  const attempt = ps1Attempt;
  Object.assign(PS1EmulatorState, {selectedGame: game, loading: true, error: null});
  const panel = document.querySelector('#ps1-player-panel'); panel.hidden = false;
  const errorBox = document.querySelector('#ps1-error'); errorBox.hidden = true;
  document.querySelector('#ps1-diagnostics').hidden = !new URL(location.href).searchParams.has('debug');
  setPs1Loading('Preparando emulador...');
  startPs1LayoutDiagnostics(attempt);
  const {downloadPs1Archive, inspectPs1File, resolvePs1Launch} = await import('./ps1-utils.js');
  const launch = resolvePs1Launch(game);
  let gameUrl = launch.bootUrl;
  const loadStarted = performance.now();
  let observedRequests = 0, observedBytes = 0;
  const updatePerformance = () => {
    setPs1Diagnostic('requests', String(observedRequests));
    setPs1Diagnostic('bytes', formatBytes(observedBytes));
    const seconds = (performance.now() - loadStarted) / 1000;
    setPs1Diagnostic('speed', observedBytes && seconds ? `${formatBytes(observedBytes / seconds)}/s` : 'aguardando dados');
  };
  if ('PerformanceObserver' in window) {
    ps1PerformanceObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) if (entry.name.includes(gameUrl)) {
        observedRequests += 1;
        observedBytes += entry.transferSize || entry.encodedBodySize || 0;
        updatePerformance();
      }
    });
    ps1PerformanceObserver.observe({type: 'resource', buffered: true});
  }
  updatePerformance();
  console.log('[PS1] boot key:', game.bootKey || game.key);
  console.log('[PS1] dependencies:', launch.dependencies.map(file => file.key));
  console.log('[PS1] gameUrl:', gameUrl);
  window.EJS_player = '#ps1-emulator';
  window.EJS_core = document.querySelector('#ps1-core').value || 'psx';
  window.EJS_gameUrl = gameUrl;
  window.EJS_pathtodata = EMULATORJS_DATA;
  window.EJS_startOnLoaded = true;
  window.EJS_gameName = game.name;
  PS1EmulatorState.biosMode = document.querySelector('#ps1-bios-mode').value;
  setPs1Diagnostic('gameUrl', gameUrl);
  setPs1Diagnostic('core', `${window.EJS_core} (pcsx_rearmed)`);
  setPs1Diagnostic('bios', PS1EmulatorState.biosMode === 'custom' && biosObjectUrl ? 'BIOS local' : 'Automático/HLE');
  if (PS1EmulatorState.biosMode === 'custom' && biosObjectUrl) window.EJS_biosUrl = biosObjectUrl;
  window.EJS_onGameStart = () => {
    if (attempt !== ps1Attempt) return;
    Object.assign(PS1EmulatorState, {instance: window.EJS_emulator || document.querySelector('#ps1-emulator canvas'), coreReady: true, running: true, loading: false, error: null});
    clearTimeout(ps1Timeout);
    setPs1Diagnostic('coreStart', `${((performance.now() - loadStarted) / 1000).toFixed(1)} s`);
    updatePerformance();
    updateLoaderState('Executando...');
    ps1LoadingTimer = setTimeout(() => { if (attempt === ps1Attempt && PS1EmulatorState.running) setPs1Loading(''); }, 900);
  };
  updateLoaderState('Conectando ao arquivo...');
  ps1HeadController = new AbortController();
  const controller = ps1HeadController;
  const headTimeout = setTimeout(() => controller.abort(), 12000);
  try {
    const inspection = await inspectPs1File(gameUrl, {signal: controller.signal});
    const details = inspection.details || inspection.attempts.findLast?.(attempt => attempt.status);
    setPs1Diagnostic('headStatus', details ? `${details.method} ${details.status} ${details.statusText}`.trim() : inspection.warning?.kind);
    setPs1Diagnostic('acceptRanges', details?.acceptRanges || 'não informado');
    setPs1Diagnostic('contentLength', details?.contentLength || 'não informado');
    if (inspection.ok === false) throw new Error(`O arquivo do jogo respondeu com erro HTTP real (${inspection.details.status} ${inspection.details.statusText}).`.trim());
    if (inspection.ok === null) console.warn('[PS1] verificação inconclusiva; o EmulatorJS tentará carregar o arquivo:', inspection.warning);
  }
  catch (error) {
    if (attempt !== ps1Attempt) return;
    failPs1(new Error(error.name === 'AbortError' ? 'A conexão com o arquivo demorou demais. Tente novamente.' : error.message));
    return;
  } finally { clearTimeout(headTimeout); if (ps1HeadController === controller) ps1HeadController = undefined; }
  if (attempt !== ps1Attempt) return;
  if (launch.dependencies.length) {
    try {
      updateLoaderState('Montando CUE + BIN...');
      const prepared = await downloadPs1Archive(game, {onProgress: (index, total, key) => {
        const name = String(key).split('/').pop();
        updateLoaderState(`Baixando ${name} (${index + 1}/${total})...`);
      }});
      if (attempt !== ps1Attempt) { URL.revokeObjectURL(prepared.gameUrl); return; }
      gameUrl = prepared.gameUrl;
      ps1GameObjectUrl = gameUrl;
      window.EJS_gameUrl = gameUrl;
      window.EJS_gameName = `${game.name}.zip`;
      setPs1Diagnostic('gameUrl', `${launch.bootUrl} (CUE + BIN montado)`);
    } catch (error) {
      if (attempt === ps1Attempt) failPs1(error);
      return;
    }
  }
  updateLoaderState('Carregando jogo...');
  const loader = document.createElement('script'); loader.src = `${EMULATORJS_DATA}loader.js`; loader.dataset.emulatorjsLoader = 'true';
  loader.onload = () => { if (attempt === ps1Attempt && PS1EmulatorState.loading) updateLoaderState('Inicializando core...'); };
  loader.onerror = () => failPs1(new Error('Não foi possível carregar o loader estável do EmulatorJS. Verifique a conexão e tente novamente.'));
  document.head.append(loader);
  ps1Timeout = setTimeout(() => { if (attempt === ps1Attempt && PS1EmulatorState.loading) failPs1(new Error('O core não confirmou o início do jogo dentro do limite. Tente novamente. Se o erro do core indicar BIOS, este jogo pode precisar de uma BIOS real para melhor compatibilidade. Imagens de disco com múltiplas trilhas também podem precisar de BIN+CUE ou CHD.')); }, 300000);
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
document.querySelectorAll('[data-ps1-close]').forEach(control => control.addEventListener('click', () => stopPs1()));
for (const system of ['ps1', 'gbc', 'gba']) {
  const button = document.querySelector(`#${system}-refresh-library`);
  const loaders = {ps1: loadPs1Library, gbc: loadGbcLibrary, gba: loadGbaLibrary};
  button?.addEventListener('click', () => refreshLibraryButton(system, button, loaders[system]).catch(() => {}));
}
document.addEventListener('click', event => {
  const play = event.target.closest('[data-play-system]');
  if (!play) return;
  const url = new URL(`/${play.dataset.playSystem}-player`, location.origin);
  url.searchParams.set('game', play.dataset.gameId);
  window.open(url.href, '_blank', 'noopener');
});
document.querySelector('#ps1-retry')?.addEventListener('click', () => PS1EmulatorState.selectedGame && startPs1(PS1EmulatorState.selectedGame));
document.querySelector('#ps1-fullscreen')?.addEventListener('click', () => document.querySelector('#ps1-player-panel')?.requestFullscreen?.());
document.querySelector('#ps1-restart')?.addEventListener('click', () => { try { window.EJS_emulator?.restart?.(); } catch (error) { failPs1(error); } });
document.querySelector('#ps1-bios-mode')?.addEventListener('change', event => { PS1EmulatorState.biosMode = event.target.value; document.querySelector('#ps1-bios-file-label').hidden = event.target.value !== 'custom'; });
document.querySelector('#ps1-bios-file')?.addEventListener('change', event => { if (biosObjectUrl) URL.revokeObjectURL(biosObjectUrl); const file = event.target.files[0]; biosObjectUrl = file ? URL.createObjectURL(file) : undefined; document.querySelector('#ps1-bios-status').textContent = file ? `BIOS local selecionada: ${file.name}` : 'Executando sem BIOS externa. Alguns jogos podem ter compatibilidade reduzida.'; });
document.querySelector('#fullscreen-emulator')?.addEventListener('click', () => document.querySelector('.emulator-viewport')?.requestFullscreen?.());
setView(requestedView(), {historyMode: 'replace'});

export {appViewState};
