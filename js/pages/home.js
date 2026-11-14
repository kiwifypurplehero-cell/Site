/**
 * Home Page - Xbox-style dashboard with hero carousel, quick resume, game rows
 */

import { createEl, $, $$, onReady } from '../utils/dom.js';
import { getHeroGames, getFeaturedGames, getRecentGames, getQuickResumeGames } from '../data.js';
import { init as initHeroCarousel } from '../components/hero-carousel.js';
import { init as initGameTile } from '../components/game-tile.js';
import { init as initSkeleton } from '../components/skeleton.js';

let heroCarousel = null;
let gameTileInstances = new Map();
let skeletonInstances = new Map();

export function render(container, params = {}) {
  const main = typeof container === 'string' ? $(container) : container;
  if (!main) return;

  // Create page structure
  main.innerHTML = `
    <div class="page page--home" data-page="home">
      <!-- Hero Carousel Section -->
      <section class="home__hero" aria-labelledby="hero-title">
        <div class="home__hero-header">
          <h2 id="hero-title" class="home__section-title">Em destaque</h2>
        </div>
        <div class="hero-carousel" id="hero-carousel" role="region" aria-label="Jogos em destaque"></div>
      </section>

      <!-- Quick Resume Section -->
      <section class="home__quick-resume" aria-labelledby="quick-resume-title">
        <div class="home__section-header">
          <h2 id="quick-resume-title" class="home__section-title">Retomar rápido</h2>
        </div>
        <div class="game-row" id="quick-resume-row" role="list" aria-label="Jogos recentes"></div>
      </section>

      <!-- Continue Playing Section -->
      <section class="home__continue" aria-labelledby="continue-title">
        <div class="home__section-header">
          <h2 id="continue-title" class="home__section-title">Continuar jogando</h2>
        </div>
        <div class="game-row" id="continue-row" role="list" aria-label="Continuar jogando"></div>
      </section>

      <!-- Recommended Section -->
      <section class="home__recommended" aria-labelledby="recommended-title">
        <div class="home__section-header">
          <h2 id="recommended-title" class="home__section-title">Recomendados para você</h2>
        </div>
        <div class="game-row" id="recommended-row" role="list" aria-label="Recomendados"></div>
      </section>

      <!-- New Releases Section -->
      <section class="home__new-releases" aria-labelledby="new-releases-title">
        <div class="home__section-header">
          <h2 id="new-releases-title" class="home__section-title">Lançamentos recentes</h2>
        </div>
        <div class="game-row" id="new-releases-row" role="list" aria-label="Lançamentos recentes"></div>
      </section>
    </div>
  `;

  // Initialize hero carousel
  const heroContainer = $('#hero-carousel', main);
  if (heroContainer) {
    const heroGames = getHeroGames();
    heroCarousel = initHeroCarousel(heroContainer, {
      games: heroGames,
      autoPlay: true,
      autoPlayInterval: 6000,
      onSelect: (game) => navigateToGame(game.id),
    });

    // Show skeletons while loading
    showSkeleton(heroContainer, 'hero');
  }

  // Initialize game rows
  initGameRow('#quick-resume-row', getQuickResumeGames(), 'quick-resume');
  initGameRow('#continue-row', getRecentGames(6), 'continue');
  initGameRow('#recommended-row', getFeaturedGames('recommended', 12), 'recommended');
  initGameRow('#new-releases-row', getFeaturedGames('new', 12), 'new-releases');

  // Setup gamepad navigation for rows
  setupGamepadNavigation(main);

  return { heroCarousel, gameTileInstances, skeletonInstances };
}

function initGameRow(selector, games, rowId) {
  const container = $(selector);
  if (!container) return;

  // Show skeleton while loading
  const skeletonId = `skeleton-${rowId}`;
  skeletonInstances.set(skeletonId, initSkeleton(container, { variant: 'card', rows: 1 }));

  // Simulate async load
  setTimeout(() => {
    const skeleton = skeletonInstances.get(skeletonId);
    if (skeleton) {
      skeleton.skeleton.hidden = true;
    }

    games.forEach((game, index) => {
      const tileContainer = createEl('div', { class: 'game-tile-wrapper', role: 'listitem' });
      container.appendChild(tileContainer);

      const instance = initGameTile(tileContainer, {
        game,
        variant: 'default',
        size: 'md',
        showProgress: rowId === 'continue' || rowId === 'quick-resume',
        onClick: () => navigateToGame(game.id),
        onPlay: () => playGame(game.id),
        onWishlist: (e, game) => toggleWishlist(game.id),
      });

      gameTileInstances.set(`${rowId}-${game.id}`, instance);
    });

    // Focus first item for gamepad
    const firstTile = container.querySelector('.game-tile');
    if (firstTile) {
      firstTile.setAttribute('data-gamepad-focus', 'true');
    }
  }, 300);
}

function setupGamepadNavigation(main) {
  const rows = main.querySelectorAll('.game-row');
  rows.forEach(row => {
    const tiles = row.querySelectorAll('.game-tile');
    tiles.forEach((tile, index) => {
      tile.dataset.gamepadIndex = index;
      tile.dataset.gamepadRow = row.id;
    });
  });
}

function showSkeleton(container, type) {
  const skeleton = initSkeleton(container, { variant: 'card', rows: 1 });
  skeletonInstances.set(`skeleton-${type}`, skeleton);
}

function navigateToGame(gameId) {
  window.location.hash = `#game/${gameId}`;
}

function playGame(gameId) {
  // Show toast notification
  import('../components/toast.js').then(({ success }) => {
    success('Iniciando jogo...', 'Jogo');
  });
}

function toggleWishlist(gameId) {
  import('../components/toast.js').then(({ info }) => {
    info('Adicionado à lista de desejos', 'Lista de desejos');
  });
}

export function cleanup() {
  heroCarousel = null;
  gameTileInstances.clear();
  skeletonInstances.clear();
}

export default { render, cleanup };