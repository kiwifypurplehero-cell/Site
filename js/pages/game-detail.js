/**
 * Game Detail Page - Detailed view of a single game
 */

import { createEl, $, $$, onReady } from '../utils/dom.js';
import { getGame, getRelatedGames, isInLibrary, isInWishlist } from '../data.js';
import { init as initGameTile } from '../components/game-tile.js';
import { init as initTabs } from '../components/tabs.js';
import { init as initProgressRing } from '../components/progress-ring.js';
import { init as initSkeleton } from '../components/skeleton.js';
import { formatBytes, formatPlaytime, formatDate, formatNumber, formatCurrency } from '../utils/format.js';
import { storage } from '../utils/storage.js';

let currentGame = null;
let gameTileInstances = new Map();
let skeletonInstances = new Map();
let tabsInstance = null;

export function render(container, params = {}) {
  const main = typeof container === 'string' ? $(container) : container;
  if (!main) return;

  const gameId = params.id;
  currentGame = getGame(gameId);

  if (!currentGame) {
    renderNotFound(main);
    return;
  }

  const inLibrary = isInLibrary(gameId);
  const inWishlist = isInWishlist(gameId);

  main.innerHTML = `
    <div class="page page--game-detail" data-page="game-detail" data-game-id="${gameId}">
      <!-- Hero Section -->
      <section class="game-detail__hero" aria-labelledby="game-title">
        <div class="game-detail__hero-bg" style="background-image: url('${currentGame.hero || currentGame.cover}')"></div>
        <div class="game-detail__hero-gradient"></div>
        <div class="game-detail__hero-content">
          <div class="game-detail__hero-main">
            <div class="game-detail__cover">
              <img src="${currentGame.cover}" alt="${currentGame.title} capa" width="200" height="280" loading="eager">
            </div>
            <div class="game-detail__meta">
              <h1 id="game-title" class="game-detail__title">${currentGame.title}</h1>
              <p class="game-detail__genre">${currentGame.genre}${currentGame.developer ? ` · ${currentGame.developer}` : ''}${currentGame.releaseDate ? ` · ${formatDate(currentGame.releaseDate)}` : ''}</p>
              <div class="game-detail__rating">
                <span class="rating" aria-label="Avaliação ${currentGame.rating} de 5 estrelas">
                  ${'★'.repeat(Math.floor(currentGame.rating))}${'☆'.repeat(5 - Math.floor(currentGame.rating))}
                  <span class="rating__value">${currentGame.rating.toFixed(1)}</span>
                  <span class="rating__count">(${formatNumber(currentGame.reviewCount)} avaliações)</span>
                </span>
              </div>
              <div class="game-detail__tags" id="game-tags"></div>
            </div>
          </div>
          <div class="game-detail__actions" id="game-actions"></div>
        </div>
      </section>

      <!-- Description & Details Tabs -->
      <section class="game-detail__content" aria-labelledby="details-title">
        <h2 id="details-title" class="visually-hidden">Detalhes do jogo</h2>
        <div class="tabs" id="detail-tabs" role="tablist" aria-orientation="horizontal"></div>
      </section>

      <!-- Related Games -->
      <section class="game-detail__related" aria-labelledby="related-title">
        <div class="home__section-header">
          <h2 id="related-title" class="home__section-title">Jogos similares</h2>
        </div>
        <div class="game-row" id="related-row" role="list" aria-label="Jogos similares"></div>
      </section>
    </div>
  `;

  // Render tags
  renderTags(main);

  // Render action buttons
  renderActions(main, inLibrary, inWishlist);

  // Initialize detail tabs
  initDetailTabs(main);

  // Load related games
  loadRelatedGames(main);

  // Setup gamepad navigation
  setupGamepadNavigation(main);

  return { tabsInstance, gameTileInstances };
}

function renderTags(main) {
  const container = $('#game-tags', main);
  if (!container || !currentGame) return;

  const tags = [];
  if (currentGame.multiplayer) tags.push({ label: currentGame.multiplayer, icon: 'users' });
  if (currentGame.coop) tags.push({ label: currentGame.coop, icon: 'gamepad' });
  if (currentGame.crossPlatform) tags.push({ label: 'Cross-platform', icon: 'globe' });
  if (currentGame.xboxPlayAnywhere) tags.push({ label: 'Xbox Play Anywhere', icon: 'cloud' });
  if (currentGame.gamePass) tags.push({ label: 'Game Pass', icon: 'gift' });
  if (currentGame.optimized) tags.push({ label: 'Otimizado para Series X|S', icon: 'zap' });
  if (currentGame.smartDelivery) tags.push({ label: 'Smart Delivery', icon: 'arrow-down-circle' });

  container.innerHTML = tags.map(tag => `
    <span class="tag tag--${tag.icon}">
      <svg class="tag__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true">
        ${getTagIcon(tag.icon)}
      </svg>
      ${tag.label}
    </span>
  `).join('');
}

function getTagIcon(name) {
  const icons = {
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />',
    gamepad: '<line x1="6" y1="11" x2="10" y2="11" /><line x1="14" y1="11" x2="18" y2="11" /><line x1="8" y1="9" x2="8" y2="13" /><line x1="16" y1="9" x2="16" y2="13" /><circle cx="12" cy="12" r="10" />',
    globe: '<circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />',
    cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />',
    gift: '<polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" />',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />',
    'arrow-down-circle': '<circle cx="12" cy="12" r="10" /><polyline points="8 12 12 16 16 12" /><line x1="12" y1="8" x2="12" y2="16" />',
  };
  return icons[name] || '';
}

function renderActions(main, inLibrary, inWishlist) {
  const container = $('#game-actions', main);
  if (!container || !currentGame) return;

  const priceHtml = currentGame.price === 0
    ? '<span class="game-detail__price game-detail__price--free">Grátis</span>'
    : `<span class="game-detail__price">${formatCurrency(currentGame.price)}</span>`;

  const isInstalled = currentGame.installed;

  container.innerHTML = `
    <div class="game-detail__primary-actions">
      ${inLibrary ? `
        ${isInstalled ? `
          <button class="btn btn--primary btn--lg" id="play-btn" data-action="play">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            Jogar
          </button>
          <button class="btn btn--secondary btn--lg" id="uninstall-btn" data-action="uninstall">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            Desinstalar
          </button>
        ` : `
          <button class="btn btn--primary btn--lg" id="install-btn" data-action="install">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Instalar
          </button>
        `}
      ` : `
        <button class="btn btn--primary btn--lg" id="buy-btn" data-action="buy">
          ${priceHtml}
        </button>
        <button class="btn btn--secondary btn--lg" id="trial-btn" data-action="trial" ${currentGame.hasTrial ? '' : 'hidden'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          Trial
        </button>
      `}
    </div>
    <div class="game-detail__secondary-actions">
      <button class="btn btn--icon ${inWishlist ? 'btn--active' : ''}" id="wishlist-btn" data-action="wishlist" aria-pressed="${inWishlist}" aria-label="${inWishlist ? 'Remover da lista de desejos' : 'Adicionar à lista de desejos'}">
        <svg viewBox="0 0 24 24" fill="${inWishlist ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
      </button>
      <button class="btn btn--icon" id="share-btn" data-action="share" aria-label="Compartilhar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
      </button>
      <button class="btn btn--icon" id="more-btn" data-action="more" aria-label="Mais opções">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
      </button>
    </div>
  `;

  // Bind action events
  bindActions(main);
}

function bindActions(main) {
  const actions = {
    play: () => playGame(currentGame.id),
    install: () => installGame(currentGame.id),
    uninstall: () => uninstallGame(currentGame.id),
    buy: () => buyGame(currentGame.id),
    trial: () => playTrial(currentGame.id),
    wishlist: (btn) => toggleWishlist(currentGame.id, btn),
    share: () => shareGame(currentGame.id),
    more: () => showMoreOptions(currentGame.id),
  };

  Object.entries(actions).forEach(([action, handler]) => {
    const btn = $(`[data-action="${action}"]`, main);
    if (btn) {
      btn.addEventListener('click', () => handler(btn));
    }
  });
}

function initDetailTabs(main) {
  const tabsContainer = $('#detail-tabs', main);
  if (!tabsContainer || !currentGame) return;

  const tabsConfig = [
    {
      label: 'Descrição',
      id: 'description',
      content: `
        <div class="game-detail__tab-panel">
          <div class="game-detail__description">${currentGame.description || 'Sem descrição disponível.'}</div>
          ${currentGame.features?.length ? `
            <h3 class="game-detail__subsection-title">Recursos</h3>
            <ul class="game-detail__features">
              ${currentGame.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `,
    },
    {
      label: 'Detalhes',
      id: 'details',
      content: `
        <div class="game-detail__tab-panel">
          <dl class="game-detail__details">
            <div class="game-detail__detail-row">
              <dt>Desenvolvedor</dt>
              <dd>${currentGame.developer || 'Desconhecido'}</dd>
            </div>
            <div class="game-detail__detail-row">
              <dt>Publicadora</dt>
              <dd>${currentGame.publisher || 'Desconhecida'}</dd>
            </div>
            <div class="game-detail__detail-row">
              <dt>Data de lançamento</dt>
              <dd>${currentGame.releaseDate ? formatDate(currentGame.releaseDate) : 'Desconhecida'}</dd>
            </div>
            <div class="game-detail__detail-row">
              <dt>Gênero</dt>
              <dd>${currentGame.genre || 'Não especificado'}</dd>
            </div>
            ${currentGame.players ? `
            <div class="game-detail__detail-row">
              <dt>Jogadores</dt>
              <dd>${currentGame.players}</dd>
            </div>
            ` : ''}
            ${currentGame.coop ? `
            <div class="game-detail__detail-row">
              <dt>Coop</dt>
              <dd>${currentGame.coop}</dd>
            </div>
            ` : ''}
            ${currentGame.multiplayer ? `
            <div class="game-detail__detail-row">
              <dt>Multiplayer</dt>
              <dd>${currentGame.multiplayer}</dd>
            </div>
            ` : ''}
            <div class="game-detail__detail-row">
              <dt>Classificação</dt>
              <dd>${currentGame.esrb || 'Não classificada'}</dd>
            </div>
            <div class="game-detail__detail-row">
              <dt>Tamanho</dt>
              <dd>${currentGame.size ? formatBytes(currentGame.size) : 'Desconhecido'}</dd>
            </div>
            ${currentGame.languages?.length ? `
            <div class="game-detail__detail-row">
              <dt>Idiomas</dt>
              <dd>${currentGame.languages.join(', ')}</dd>
            </div>
            ` : ''}
          </dl>
        </div>
      `,
    },
    {
      label: 'Conquistas',
      id: 'achievements',
      content: `
        <div class="game-detail__tab-panel">
          ${currentGame.achievements?.length ? `
            <div class="game-detail__achievements-summary">
              <div class="progress-ring" id="achievement-progress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso de conquistas"></div>
              <div class="game-detail__achievements-stats">
                <span class="stat">${currentGame.achievements.filter(a => a.unlocked).length} / ${currentGame.achievements.length} desbloqueadas</span>
                <span class="stat">${currentGame.gamerscore || 0}G / ${currentGame.maxGamerscore || 1000}G</span>
              </div>
            </div>
            <div class="game-detail__achievements-list" id="achievements-list"></div>
          ` : '<p class="game-detail__no-data">Este jogo não possui conquistas.</p>'}
        </div>
      `,
    },
    {
      label: 'Capturas de tela',
      id: 'screenshots',
      content: `
        <div class="game-detail__tab-panel">
          <div class="game-detail__screenshots" id="screenshots-container"></div>
        </div>
      `,
    },
  ];

  tabsInstance = initTabs(tabsContainer, {
    tabs: tabsConfig,
    defaultIndex: 0,
    onChange: (index, trigger, panel) => {
      const tabId = tabsConfig[index].id;
      if (tabId === 'achievements') renderAchievements(main);
      if (tabId === 'screenshots') renderScreenshots(main);
    },
  });

  // Initialize achievements progress ring after first render
  setTimeout(() => {
    const progressContainer = $('#achievement-progress', main);
    if (progressContainer && currentGame?.achievements?.length) {
      const unlocked = currentGame.achievements.filter(a => a.unlocked).length;
      const total = currentGame.achievements.length;
      const percentage = Math.round((unlocked / total) * 100);
      initProgressRing(progressContainer, {
        value: percentage,
        max: 100,
        size: 'lg',
        strokeWidth: 6,
        showValue: true,
        formatValue: v => `${v}%`,
      });
    }
  }, 100);
}

function renderAchievements(main) {
  const container = $('#achievements-list', main);
  if (!container || !currentGame?.achievements?.length) return;

  container.innerHTML = currentGame.achievements.map(achievement => `
    <article class="achievement ${achievement.unlocked ? 'achievement--unlocked' : 'achievement--locked'}" data-id="${achievement.id}">
      <div class="achievement__icon">
        ${achievement.unlocked
          ? `<img src="${achievement.icon}" alt="" width="64" height="64" loading="lazy">`
          : `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="8" y="8" width="48" height="48" rx="8" /><path d="M20 32l8 8 16-16" /></svg>`
        }
      </div>
      <div class="achievement__info">
        <h4 class="achievement__name">${achievement.name}</h4>
        <p class="achievement__description">${achievement.description}</p>
        <div class="achievement__meta">
          <span class="achievement__gamerscore">${achievement.gamerscore}G</span>
          ${achievement.unlocked ? `<time class="achievement__unlocked" datetime="${achievement.unlockedAt}">Desbloqueada em ${formatDate(achievement.unlockedAt)}</time>` : ''}
          ${achievement.rare ? '<span class="achievement__rare">Rara</span>' : ''}
        </div>
      </div>
    </article>
  `).join('');
}

function renderScreenshots(main) {
  const container = $('#screenshots-container', main);
  if (!container || !currentGame?.screenshots?.length) return;

  container.innerHTML = currentGame.screenshots.map((screenshot, index) => `
    <div class="game-detail__screenshot" data-index="${index}">
      <img src="${screenshot}" alt="Captura de tela ${index + 1} de ${currentGame.title}" loading="lazy">
    </div>
  `).join('');
}

function loadRelatedGames(main) {
  const container = $('#related-row', main);
  if (!container || !currentGame) return;

  const relatedGames = getRelatedGames(currentGame.id, 6);

  const skeletonId = 'related-skeleton';
  skeletonInstances.set(skeletonId, initSkeleton(container, { variant: 'card', rows: 1 }));

  setTimeout(() => {
    const skeleton = skeletonInstances.get(skeletonId);
    if (skeleton) skeleton.skeleton.hidden = true;

    relatedGames.forEach((game, index) => {
      const tileContainer = createEl('div', { class: 'game-tile-wrapper', role: 'listitem' });
      container.appendChild(tileContainer);

      const instance = initGameTile(tileContainer, {
        game,
        variant: 'default',
        size: 'md',
        onClick: () => navigateToGame(game.id),
      });

      gameTileInstances.set(`related-${game.id}`, instance);
    });

    setupGamepadNavigation(container.parentElement);
  }, 300);
}

function setupGamepadNavigation(main) {
  const relatedContainer = $('#related-row', main);
  if (relatedContainer) {
    const tiles = relatedContainer.querySelectorAll('.game-tile');
    tiles.forEach((tile, index) => {
      tile.dataset.gamepadIndex = index;
      tile.dataset.gamepadRow = 'related';
    });
  }
}

function renderNotFound(main) {
  main.innerHTML = `
    <div class="page page--game-detail page--not-found">
      <div class="game-detail__not-found">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="80" height="80" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
        <h1>Jogo não encontrado</h1>
        <p>O jogo que você procura não existe ou foi removido.</p>
        <a href="#home" class="btn btn--primary">Voltar ao Início</a>
      </div>
    </div>
  `;
}

function navigateToGame(gameId) {
  window.location.hash = `#game/${gameId}`;
}

function playGame(gameId) {
  import('../components/toast.js').then(({ success }) => {
    success('Iniciando jogo...', currentGame?.title);
  });
}

function installGame(gameId) {
  import('../components/toast.js').then(({ info }) => {
    info('Iniciando download...', currentGame?.title);
  });
  // Simulate install progress
  setTimeout(() => {
    import('../components/toast.js').then(({ success }) => {
      success('Instalação concluída', currentGame?.title);
    });
    // Re-render to update buttons
    render($('.page--game-detail'), { id: gameId });
  }, 2000);
}

function uninstallGame(gameId) {
  import('../components/modal.js').then(({ confirm }) => {
    confirm('Desinstalar jogo?', 'O jogo será removido do seu console, mas permanecerá na sua biblioteca.', () => {
      import('../components/toast.js').then(({ success }) => {
        success('Jogo desinstalado', currentGame?.title);
      });
      render($('.page--game-detail'), { id: gameId });
    });
  });
}

function buyGame(gameId) {
  import('../components/toast.js').then(({ success }) => {
    success('Redirecionando para a loja...', 'Compra');
  });
}

function playTrial(gameId) {
  import('../components/toast.js').then(({ info }) => {
    info('Iniciando trial...', currentGame?.title);
  });
}

function toggleWishlist(gameId, btn) {
  const inWishlist = btn.getAttribute('aria-pressed') === 'true';
  const newState = !inWishlist;

  btn.setAttribute('aria-pressed', newState);
  btn.classList.toggle('btn--active', newState);

  const icon = btn.querySelector('svg');
  if (icon) {
    icon.setAttribute('fill', newState ? 'currentColor' : 'none');
  }

  btn.setAttribute('aria-label', newState ? 'Remover da lista de desejos' : 'Adicionar à lista de desejos');

  import('../components/toast.js').then(({ info, success }) => {
    (newState ? success : info)(newState ? 'Adicionado à lista de desejos' : 'Removido da lista de desejos', 'Lista de desejos');
  });
}

function shareGame(gameId) {
  if (navigator.share) {
    navigator.share({
      title: currentGame?.title,
      text: currentGame?.description,
      url: window.location.href,
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href);
    import('../components/toast.js').then(({ success }) => {
      success('Link copiado para a área de transferência', 'Compartilhar');
    });
  }
}

function showMoreOptions(gameId) {
  import('../components/modal.js').then(({ alert }) => {
    alert('Mais opções', 'Funcionalidades adicionais serão implementadas em breve.');
  });
}

export function cleanup() {
  currentGame = null;
  tabsInstance = null;
  gameTileInstances.clear();
  skeletonInstances.clear();
}

export default { render, cleanup };