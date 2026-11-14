/**
 * Library Page - User's game library with filters, sorting, and views
 */

import { createEl, $, $$, onReady, delegate } from '../utils/dom.js';
import { getLibraryGames, getInstalledGames, getWishlistGames, filterGames, sortGames } from '../data.js';
import { init as initGameTile } from '../components/game-tile.js';
import { init as initTabs } from '../components/tabs.js';
import { init as initDropdown } from '../components/dropdown.js';
import { init as initSkeleton } from '../components/skeleton.js';
import { init as initToggle } from '../components/toggle.js';
import { storage } from '../utils/storage.js';

let currentView = 'grid'; // grid, list
let currentFilter = 'all'; // all, installed, wishlist, uninstalled
let currentSort = 'recent'; // recent, alphabetical, playtime, size
let gameTileInstances = new Map();
let skeletonInstances = new Map();
let tabsInstance = null;
let sortDropdown = null;
let viewToggle = null;

export function render(container, params = {}) {
  const main = typeof container === 'string' ? $(container) : container;
  if (!main) return;

  main.innerHTML = `
    <div class="page page--library" data-page="library">
      <!-- Library Header -->
      <header class="library__header">
        <div class="library__title-area">
          <h1 class="library__title">Minha Biblioteca</h1>
          <p class="library__subtitle" id="library-count">0 jogos</p>
        </div>
        <div class="library__controls">
          <div class="library__view-toggle" id="view-toggle" role="group" aria-label="Alternar visualização"></div>
          <div class="library__sort" id="sort-dropdown"></div>
        </div>
      </header>

      <!-- Filter Tabs -->
      <nav class="library__filters" aria-label="Filtros da biblioteca">
        <div class="tabs" id="filter-tabs" role="tablist" aria-orientation="horizontal"></div>
      </nav>

      <!-- Game Grid/List -->
      <div class="library__games" id="library-games" role="list" aria-label="Jogos da biblioteca"></div>

      <!-- Empty State -->
      <div class="library__empty" id="library-empty" hidden>
        <svg class="library__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <h2 class="library__empty-title">Biblioteca vazia</h2>
        <p class="library__empty-message">Nenhum jogo encontrado com os filtros atuais.</p>
        <a href="#store" class="btn btn--primary">Ir para a Loja</a>
      </div>
    </div>
  `;

  // Initialize filter tabs
  initFilterTabs(main);

  // Initialize view toggle
  initViewToggle(main);

  // Initialize sort dropdown
  initSortDropdown(main);

  // Load and render games
  loadGames();

  // Setup gamepad navigation
  setupGamepadNavigation(main);

  return { tabsInstance, sortDropdown, viewToggle, gameTileInstances };
}

function initFilterTabs(main) {
  const tabsContainer = $('#filter-tabs', main);
  if (!tabsContainer) return;

  const tabsConfig = [
    { label: 'Todos', id: 'all', content: '' },
    { label: 'Instalados', id: 'installed', content: '' },
    { label: 'Lista de desejos', id: 'wishlist', content: '' },
    { label: 'Não instalados', id: 'uninstalled', content: '' },
  ];

  tabsInstance = initTabs(tabsContainer, {
    tabs: tabsConfig,
    defaultIndex: 0,
    onChange: (index, trigger, panel) => {
      currentFilter = tabsConfig[index].id;
      loadGames();
    },
  });
}

function initViewToggle(main) {
  const container = $('#view-toggle', main);
  if (!container) return;

  const savedView = storage.get('library-view', 'grid');
  currentView = savedView;

  container.innerHTML = `
    <button class="btn btn--icon ${currentView === 'grid' ? 'btn--active' : ''}" data-view="grid" aria-label="Visualização em grade" aria-pressed="${currentView === 'grid'}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    </button>
    <button class="btn btn--icon ${currentView === 'list' ? 'btn--active' : ''}" data-view="list" aria-label="Visualização em lista" aria-pressed="${currentView === 'list'}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  `;

  viewToggle = container;
  container.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      setView(btn.dataset.view);
    });
  });

  updateViewClass(main);
}

function initSortDropdown(main) {
  const container = $('#sort-dropdown', main);
  if (!container) return;

  const savedSort = storage.get('library-sort', 'recent');
  currentSort = savedSort;

  const sortOptions = [
    { label: 'Adicionados recentemente', value: 'recent' },
    { label: 'A-Z', value: 'alphabetical' },
    { label: 'Tempo de jogo', value: 'playtime' },
    { label: 'Tamanho', value: 'size' },
  ];

  sortDropdown = initDropdown(container, {
    items: sortOptions.map(opt => ({ label: opt.label, value: opt.value, active: opt.value === currentSort })),
    placeholder: 'Ordenar por',
    onSelect: (item) => {
      currentSort = item.value;
      storage.set('library-sort', currentSort);
      loadGames();
    },
  });
}

function loadGames() {
  const gamesContainer = $('#library-games');
  const emptyContainer = $('#library-empty');

  if (!gamesContainer) return;

  // Show skeleton
  const skeletonId = 'library-skeleton';
  skeletonInstances.set(skeletonId, initSkeleton(gamesContainer, { variant: currentView === 'grid' ? 'card' : 'text', rows: currentView === 'grid' ? 2 : 4 }));

  // Simulate async load
  setTimeout(() => {
    const skeleton = skeletonInstances.get(skeletonId);
    if (skeleton) skeleton.skeleton.hidden = true;

    // Get games based on filter
    let games = [];
    switch (currentFilter) {
      case 'installed':
        games = getInstalledGames();
        break;
      case 'wishlist':
        games = getWishlistGames();
        break;
      case 'uninstalled':
        games = getLibraryGames().filter(g => !g.installed);
        break;
      default:
        games = getLibraryGames();
    }

    // Sort games
    games = sortGames(games, currentSort);

    // Update count
    const countEl = $('#library-count');
    if (countEl) countEl.textContent = `${games.length} jogo${games.length !== 1 ? 's' : ''}`;

    // Render games
    if (games.length === 0) {
      gamesContainer.innerHTML = '';
      gamesContainer.hidden = true;
      if (emptyContainer) emptyContainer.hidden = false;
      return;
    }

    if (emptyContainer) emptyContainer.hidden = true;
    gamesContainer.hidden = false;
    gamesContainer.innerHTML = '';

    games.forEach((game, index) => {
      const tileContainer = createEl('div', { class: `game-tile-wrapper game-tile-wrapper--${currentView}`, role: 'listitem' });
      gamesContainer.appendChild(tileContainer);

      const instance = initGameTile(tileContainer, {
        game,
        variant: currentView === 'list' ? 'list' : 'default',
        size: 'md',
        showProgress: true,
        showActions: true,
        onClick: () => navigateToGame(game.id),
        onPlay: () => playGame(game.id),
        onWishlist: (e, game) => toggleWishlist(game.id),
        onUninstall: (e, game) => uninstallGame(game.id),
      });

      gameTileInstances.set(`library-${game.id}`, instance);
    });

    updateViewClass(gamesContainer.parentElement);
    setupGamepadNavigation(gamesContainer.parentElement);
  }, 300);
}

function setView(view) {
  if (view === currentView) return;
  currentView = view;
  storage.set('library-view', view);

  const container = $('#library-games');
  if (!container) return;

  // Update button states
  viewToggle?.querySelectorAll('[data-view]').forEach(btn => {
    const active = btn.dataset.view === view;
    btn.classList.toggle('btn--active', active);
    btn.setAttribute('aria-pressed', active);
  });

  // Re-render with new view
  loadGames();
}

function updateViewClass(parent) {
  if (!parent) return;
  parent.classList.toggle('library--grid', currentView === 'grid');
  parent.classList.toggle('library--list', currentView === 'list');
}

function setupGamepadNavigation(main) {
  const container = $('#library-games', main);
  if (!container) return;

  const tiles = container.querySelectorAll('.game-tile');
  tiles.forEach((tile, index) => {
    tile.dataset.gamepadIndex = index;
    tile.dataset.gamepadRow = 'library';
  });
}

function navigateToGame(gameId) {
  window.location.hash = `#game/${gameId}`;
}

function playGame(gameId) {
  import('../components/toast.js').then(({ success }) => {
    success('Iniciando jogo...', 'Jogo');
  });
}

function toggleWishlist(gameId) {
  import('../components/toast.js').then(({ info }) => {
    info('Lista de desejos atualizada', 'Biblioteca');
  });
  loadGames(); // Refresh to update filter counts
}

function uninstallGame(gameId) {
  import('../components/modal.js').then(({ confirm }) => {
    confirm('Desinstalar jogo?', 'O jogo será removido do seu console, mas permanecerá na sua biblioteca.', () => {
      import('../components/toast.js').then(({ success }) => {
        success('Jogo desinstalado', 'Biblioteca');
      });
      loadGames();
    });
  });
}

export function cleanup() {
  tabsInstance = null;
  sortDropdown = null;
  viewToggle = null;
  gameTileInstances.clear();
  skeletonInstances.clear();
}

export default { render, cleanup };