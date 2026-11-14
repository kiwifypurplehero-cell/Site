/**
 * Store Page - Game store with categories, search, featured games
 */

import { createEl, $, $$, onReady, delegate } from '../utils/dom.js';
import { getAllGames, getCategories, filterGames, searchGames, sortGames } from '../data.js';
import { init as initGameTile } from '../components/game-tile.js';
import { init as initTabs } from '../components/tabs.js';
import { init as initDropdown } from '../components/dropdown.js';
import { init as initSkeleton } from '../components/skeleton.js';
import { init as initHeroCarousel } from '../components/hero-carousel.js';
import { storage } from '../utils/storage.js';

let currentCategory = 'all';
let currentSort = 'featured';
let gameTileInstances = new Map();
let skeletonInstances = new Map();
let categoryTabs = null;
let sortDropdown = null;
let heroCarousel = null;

export function render(container, params = {}) {
  const main = typeof container === 'string' ? $(container) : container;
  if (!main) return;

  main.innerHTML = `
    <div class="page page--store" data-page="store">
      <!-- Store Header -->
      <header class="store__header">
        <div class="store__title-area">
          <h1 class="store__title">Loja</h1>
          <p class="store__subtitle">Descubra novos jogos</p>
        </div>
        <div class="store__search-btn" id="store-search-btn" aria-label="Buscar na loja">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
      </header>

      <!-- Featured Hero -->
      <section class="store__featured" aria-labelledby="featured-title">
        <div class="hero-carousel" id="store-hero-carousel" role="region" aria-label="Jogos em destaque na loja"></div>
      </section>

      <!-- Category Tabs -->
      <nav class="store__categories" aria-label="Categorias da loja">
        <div class="tabs" id="category-tabs" role="tablist" aria-orientation="horizontal"></div>
      </nav>

      <!-- Sort & Filter Bar -->
      <div class="store__toolbar">
        <div class="store__sort" id="store-sort-dropdown"></div>
        <div class="store__filter" id="store-filter-dropdown"></div>
      </div>

      <!-- Game Grid -->
      <div class="store__games" id="store-games" role="list" aria-label="Jogos da loja"></div>

      <!-- Load More -->
      <div class="store__load-more" id="store-load-more">
        <button class="btn btn--secondary" id="load-more-btn">Carregar mais</button>
      </div>

      <!-- Empty State -->
      <div class="store__empty" id="store-empty" hidden>
        <svg class="store__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
        <h2 class="store__empty-title">Nenhum jogo encontrado</h2>
        <p class="store__empty-message">Tente ajustar os filtros ou buscar por outro termo.</p>
      </div>
    </div>
  `;

  // Initialize hero carousel
  initStoreHero(main);

  // Initialize category tabs
  initCategoryTabs(main);

  // Initialize sort dropdown
  initSortDropdown(main);

  // Initialize filter dropdown
  initFilterDropdown(main);

  // Load games
  loadGames();

  // Search button
  const searchBtn = $('#store-search-btn', main);
  searchBtn?.addEventListener('click', () => {
    import('../components/search-modal.js').then(({ open }) => open());
  });

  // Load more button
  const loadMoreBtn = $('#load-more-btn', main);
  loadMoreBtn?.addEventListener('click', loadMoreGames);

  // Setup gamepad navigation
  setupGamepadNavigation(main);

  return { categoryTabs, sortDropdown, heroCarousel, gameTileInstances };
}

function initStoreHero(main) {
  const container = $('#store-hero-carousel', main);
  if (!container) return;

  const featuredGames = getAllGames().filter(g => g.featured).slice(0, 5);
  heroCarousel = initHeroCarousel(container, {
    games: featuredGames,
    autoPlay: true,
    autoPlayInterval: 7000,
    showIndicators: true,
    onSelect: (game) => navigateToGame(game.id),
  });
}

function initCategoryTabs(main) {
  const tabsContainer = $('#category-tabs', main);
  if (!tabsContainer) return;

  const categories = getCategories();
  const tabsConfig = [
    { label: 'Todos', id: 'all', content: '' },
    ...categories.map(cat => ({ label: cat.name, id: cat.id, content: '' })),
  ];

  categoryTabs = initTabs(tabsContainer, {
    tabs: tabsConfig,
    defaultIndex: 0,
    onChange: (index, trigger, panel) => {
      currentCategory = tabsConfig[index].id;
      loadGames(true);
    },
  });
}

function initSortDropdown(main) {
  const container = $('#store-sort-dropdown', main);
  if (!container) return;

  const savedSort = storage.get('store-sort', 'featured');
  currentSort = savedSort;

  const sortOptions = [
    { label: 'Em destaque', value: 'featured' },
    { label: 'Mais vendidos', value: 'bestselling' },
    { label: 'Melhor avaliados', value: 'rating' },
    { label: 'Mais recentes', value: 'newest' },
    { label: 'Preço: menor primeiro', value: 'price-asc' },
    { label: 'Preço: maior primeiro', value: 'price-desc' },
    { label: 'A-Z', value: 'alphabetical' },
  ];

  sortDropdown = initDropdown(container, {
    items: sortOptions.map(opt => ({ label: opt.label, value: opt.value, active: opt.value === currentSort })),
    placeholder: 'Ordenar por',
    onSelect: (item) => {
      currentSort = item.value;
      storage.set('store-sort', currentSort);
      loadGames(true);
    },
  });
}

function initFilterDropdown(main) {
  const container = $('#store-filter-dropdown', main);
  if (!container) return;

  const filterOptions = [
    { label: 'Todos os preços', value: 'all' },
    { label: 'Gratuitos', value: 'free' },
    { label: 'Até R$ 50', value: 'under-50' },
    { label: 'R$ 50 - R$ 150', value: '50-150' },
    { label: 'R$ 150 - R$ 300', value: '150-300' },
    { label: 'Acima de R$ 300', value: 'over-300' },
  ];

  initDropdown(container, {
    items: filterOptions.map(opt => ({ label: opt.label, value: opt.value })),
    placeholder: 'Filtrar por preço',
    onSelect: (item) => {
      // Filter by price would be implemented here
      loadGames(true);
    },
  });
}

let loadedCount = 0;
const GAMES_PER_PAGE = 20;

function loadGames(reset = false) {
  const gamesContainer = $('#store-games');
  const emptyContainer = $('#store-empty');
  const loadMoreContainer = $('#store-load-more');

  if (!gamesContainer) return;

  if (reset) {
    loadedCount = 0;
    gamesContainer.innerHTML = '';
  }

  // Show skeleton for initial load
  if (reset) {
    const skeletonId = 'store-skeleton';
    skeletonInstances.set(skeletonId, initSkeleton(gamesContainer, { variant: 'card', rows: 2 }));
  }

  setTimeout(() => {
    if (reset) {
      const skeleton = skeletonInstances.get('store-skeleton');
      if (skeleton) skeleton.skeleton.hidden = true;
    }

    let games = getAllGames();

    // Filter by category
    if (currentCategory !== 'all') {
      games = games.filter(g => g.genres?.includes(currentCategory) || g.genre === currentCategory);
    }

    // Sort games
    games = sortGames(games, currentSort);

    // Paginate
    const pageGames = games.slice(loadedCount, loadedCount + GAMES_PER_PAGE);
    loadedCount += pageGames.length;

    if (pageGames.length === 0 && loadedCount === 0) {
      gamesContainer.hidden = true;
      loadMoreContainer.hidden = true;
      if (emptyContainer) emptyContainer.hidden = false;
      return;
    }

    if (emptyContainer) emptyContainer.hidden = true;
    gamesContainer.hidden = false;

    pageGames.forEach((game, index) => {
      const tileContainer = createEl('div', { class: 'game-tile-wrapper', role: 'listitem' });
      gamesContainer.appendChild(tileContainer);

      const instance = initGameTile(tileContainer, {
        game,
        variant: 'store',
        size: 'md',
        showPrice: true,
        showRating: true,
        onClick: () => navigateToGame(game.id),
        onBuy: () => buyGame(game.id),
        onWishlist: (e, game) => toggleWishlist(game.id),
      });

      gameTileInstances.set(`store-${game.id}`, instance);
    });

    // Show/hide load more
    loadMoreContainer.hidden = loadedCount >= games.length;

    setupGamepadNavigation(gamesContainer.parentElement);
  }, reset ? 300 : 100);
}

function loadMoreGames() {
  loadGames(false);
}

function setupGamepadNavigation(main) {
  const container = $('#store-games', main);
  if (!container) return;

  const tiles = container.querySelectorAll('.game-tile');
  tiles.forEach((tile, index) => {
    tile.dataset.gamepadIndex = index;
    tile.dataset.gamepadRow = 'store';
  });
}

function navigateToGame(gameId) {
  window.location.hash = `#game/${gameId}`;
}

function buyGame(gameId) {
  import('../components/toast.js').then(({ success }) => {
    success('Redirecionando para compra...', 'Loja');
  });
}

function toggleWishlist(gameId) {
  import('../components/toast.js').then(({ info }) => {
    info('Adicionado à lista de desejos', 'Loja');
  });
}

export function cleanup() {
  categoryTabs = null;
  sortDropdown = null;
  heroCarousel = null;
  gameTileInstances.clear();
  skeletonInstances.clear();
  loadedCount = 0;
}

export default { render, cleanup };