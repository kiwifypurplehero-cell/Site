/**
 * Game Tile Component - Reusable game card with multiple variants
 */

import { createEl, $, $$ } from '../utils/dom.js';
import { navigate } from '../router.js';
import { formatTime, formatPrice, formatNumber } from '../utils/format.js';

const ICONS = {
  play: '<polygon points="5 3 19 12 5 21 5 3"/>',
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  installed: '<circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.98.98H4.98a.98.98 0 0 1-.98-.98v-2.34c0-.55.45-.98.98-.98h10.04c.53 0 .98.43.98.98z"/><path d="M18 6a6 6 0 0 1 0 12H6a6 6 0 0 1 0-12h12z"/>',
  sale: '<path d="M8 6L21 19"/><circle cx="12" cy="12" r="10"/>',
  new: '<path d="M12 5v14"/><path d="M5 12h14"/>',
};

function createIcon(name, size = 16) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="${size}" height="${size}" aria-hidden="true">${ICONS[name]}</svg>`;
}

export function render(game, variant = 'default', container = null) {
  const el = createTileElement(game, variant);

  if (container) {
    container.appendChild(el);
  }

  return el;
}

function createTileElement(game, variant) {
  const classes = ['game-tile'];
  const isCompact = variant === 'compact';
  const isStore = variant === 'store';
  const isLibrary = variant === 'library';
  const isWishlist = variant === 'wishlist';

  if (isCompact) classes.push('game-tile--compact');
  if (isStore) classes.push('game-tile--store');
  if (isLibrary) classes.push('game-tile--library');
  if (isWishlist) classes.push('game-tile--wishlist');

  const tile = createEl('article', {
    class: classes.join(' '),
    'data-game-id': game.id,
    tabindex: 0,
    role: 'button',
    'aria-label': `${game.title}${game.installed ? ', instalado' : ''}${game.onSale ? ', em promoção' : ''}`,
  });

  // Cover image
  const cover = createEl('div', { class: 'game-tile__cover' }, [
    createEl('img', {
      class: 'game-tile__image',
      src: game.cover,
      alt: '',
      loading: 'lazy',
      width: 320,
      height: 200,
    }),
    createBadges(game),
    isWishlist && createHeartButton(game),
    game.installed && createEl('div', { class: 'game-tile__installed-badge' }, createIcon('installed', 20)),
  ]);

  // Progress bar (for library)
  let progressBar = null;
  if (isLibrary && game.completion !== undefined) {
    progressBar = createEl('div', { class: 'game-tile__progress' }, [
      createEl('div', {
        class: 'game-tile__progress-bar',
        style: `width: ${game.completion}%`,
        role: 'progressbar',
        'aria-valuenow': game.completion,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-label': `Progresso: ${game.completion}%`,
      }),
    ]);
  }

  // Content
  const content = createEl('div', { class: 'game-tile__content' }, [
    createEl('h3', { class: 'game-tile__title' }, game.title),
    createMeta(game, variant),
    isStore && createPrice(game),
  ]);

  if (progressBar) cover.appendChild(progressBar);

  tile.append(cover, content);

  // Click handler
  tile.addEventListener('click', (e) => {
    if (e.target.closest('.game-tile__heart')) return;
    if (e.target.closest('.game-tile__installed-badge')) return;
    navigate(`#game/${game.id}`);
  });

  // Keyboard
  tile.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (e.target.closest('.game-tile__heart')) return;
      navigate(`#game/${game.id}`);
    }
  });

  return tile;
}

function createBadges(game) {
  const badges = [];

  if (game.onSale) {
    badges.push(createEl('span', { class: 'badge badge--sale' }, [
      createIcon('sale', 10),
      ' PROMO',
    ]));
  }

  if (game.featured) {
    badges.push(createEl('span', { class: 'badge badge--featured' }, 'DESTAQUE'));
  }

  if (game.rating) {
    const rating = formatRating(game.rating);
    badges.push(createEl('span', { class: 'badge badge--platform' }, rating.label));
  }

  return createEl('div', { class: 'game-tile__badges' }, badges);
}

function formatRating(rating) {
  const ratings = {
    E: { label: 'L', color: '#4ade80' },
    E10: { label: '10+', color: '#84cc16' },
    T: { label: '13+', color: '#fbbf24' },
    M: { label: '17+', color: '#fb923c' },
    AO: { label: '18+', color: '#ef4444' },
    '3': { label: '3+', color: '#4ade80' },
    '7': { label: '7+', color: '#84cc16' },
    '12': { label: '12+', color: '#fbbf24' },
    '16': { label: '16+', color: '#fb923c' },
    '18': { label: '18+', color: '#ef4444' },
  };
  return ratings[rating] || { label: rating, color: '#7a7a9a' };
}

function createHeartButton(game) {
  return createEl('button', {
    class: `game-tile__heart ${game.wishlisted ? 'active' : ''}`,
    'aria-label': game.wishlisted ? 'Remover da lista de desejos' : 'Adicionar à lista de desejos',
    'aria-pressed': game.wishlisted,
    onclick: (e) => {
      e.stopPropagation();
      toggleWishlist(game.id, e.currentTarget);
    },
  }, createIcon('heart'));
}

function toggleWishlist(gameId, button) {
  const isActive = button.classList.toggle('active');
  button.setAttribute('aria-pressed', isActive);
  button.setAttribute('aria-label', isActive ? 'Remover da lista de desejos' : 'Adicionar à lista de desejos');

  // In a real app, this would update backend
  console.log(`Wishlist ${isActive ? 'added' : 'removed'}: ${gameId}`);
}

function createMeta(game, variant) {
  const items = [];

  if (variant === 'store') {
    // Store shows rating, genres
    if (game.metacritic) {
      items.push(createEl('span', { class: 'game-tile__meta-item' }, [
        createIcon('trophy', 14),
        game.metacritic,
      ]));
    }
    if (game.genres?.length) {
      items.push(createEl('span', { class: 'game-tile__meta-item' }, [
        game.genres.slice(0, 2).join(', '),
      ]));
    }
  } else if (variant === 'library') {
    // Library shows playtime, last played, platform
    if (game.playtime) {
      items.push(createEl('span', { class: 'game-tile__meta-item' }, [
        createIcon('clock', 14),
        formatTime(game.playtime),
      ]));
    }
    if (game.lastPlayed) {
      items.push(createEl('span', { class: 'game-tile__meta-item' }, [
        formatRelativeTime(game.lastPlayed),
      ]));
    }
    if (game.platforms?.length) {
      items.push(createEl('span', { class: 'game-tile__meta-item' }, [
        game.platforms[0],
      ]));
    }
  } else if (variant === 'compact') {
    // Compact shows minimal info
    if (game.playtime) {
      items.push(createEl('span', { class: 'game-tile__meta-item' }, [
        createIcon('clock', 12),
        formatTime(game.playtime),
      ]));
    }
  } else {
    // Default shows platforms
    if (game.platforms?.length) {
      items.push(createEl('span', { class: 'game-tile__meta-item' }, [
        game.platforms.join(', '),
      ]));
    }
  }

  return createEl('div', { class: 'game-tile__meta' }, items);
}

function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function createPrice(game) {
  if (game.price === 0) {
    return createEl('div', { class: 'game-tile__price' }, [
      createEl('span', { class: 'game-tile__price-current' }, 'Grátis'),
    ]);
  }

  if (game.onSale && game.salePrice != null) {
    return createEl('div', { class: 'game-tile__price' }, [
      createEl('span', { class: 'game-tile__price-current' }, formatPrice(game.salePrice)),
      createEl('span', { class: 'game-tile__price-original' }, formatPrice(game.price)),
      createEl('span', { class: 'game-tile__price-sale-badge' }, `-${Math.round((1 - game.salePrice / game.price) * 100)}%`),
    ]);
  }

  return createEl('div', { class: 'game-tile__price' }, [
    createEl('span', { class: 'game-tile__price-current' }, formatPrice(game.price)),
  ]);
}

// Render multiple tiles
export function renderGrid(games, variant = 'default', container) {
  if (!container) return;

  container.innerHTML = '';
  const fragment = document.createDocumentFragment();

  games.forEach(game => {
    fragment.appendChild(createTileElement(game, variant));
  });

  container.appendChild(fragment);
}

// Skeleton tile for loading
export function renderSkeleton(variant = 'default', container) {
  if (!container) return;

  const classes = ['game-tile', 'game-tile--skeleton'];
  if (variant === 'compact') classes.push('game-tile--compact');

  const tile = createEl('article', { class: classes.join(' ') }, [
    createEl('div', { class: 'game-tile__cover skeleton skeleton--card' }),
    createEl('div', { class: 'game-tile__content' }, [
      createEl('div', { class: 'skeleton skeleton--title' }),
      createEl('div', { class: 'skeleton skeleton--text' }),
      createEl('div', { class: 'skeleton skeleton--text' }),
    ]),
  ]);

  container.appendChild(tile);
  return tile;
}

export function renderSkeletonGrid(count, variant = 'default', container) {
  if (!container) return;
  container.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    fragment.appendChild(renderSkeleton(variant));
  }
  container.appendChild(fragment);
}

export default { render, renderGrid, renderSkeleton, renderSkeletonGrid };