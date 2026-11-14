/**
 * Profile Page - User profile with achievements, friends, activity feed
 */

import { createEl, $, $$, onReady } from '../utils/dom.js';
import { getCurrentUser, getFriends, getRecentActivity, getUserAchievements, getUserStats } from '../data.js';
import { init as initAvatar } from '../components/avatar.js';
import { init as initTabs } from '../components/tabs.js';
import { init as initGameTile } from '../components/game-tile.js';
import { init as initProgressRing } from '../components/progress-ring.js';
import { init as initSkeleton } from '../components/skeleton.js';
import { init as initBadge } from '../components/badge.js';
import { formatNumber, formatDate, formatPlaytime, formatGamerscore, getTierName, getTierColor } from '../utils/format.js';
import { storage } from '../utils/storage.js';

let currentUser = null;
let tabsInstance = null;
let gameTileInstances = new Map();
let skeletonInstances = new Map();
let avatarInstance = null;

export function render(container, params = {}) {
  const main = typeof container === 'string' ? $(container) : container;
  if (!main) return;

  currentUser = getCurrentUser();
  const stats = getUserStats();
  const tier = getTierName(stats.gamerscore);
  const tierColor = getTierColor(tier);

  main.innerHTML = `
    <div class="page page--profile" data-page="profile">
      <!-- Profile Header -->
      <header class="profile__header">
        <div class="profile__background" style="background-image: url('${currentUser.backgroundImage || 'assets/placeholders/hero-placeholder.svg'}')"></div>
        <div class="profile__gradient"></div>
        <div class="profile__content">
          <div class="profile__avatar-wrapper" id="profile-avatar"></div>
          <div class="profile__info">
            <h1 class="profile__name">${currentUser.name}</h1>
            <p class="profile__gamertag">${currentUser.gamertag}</p>
            <div class="profile__tier" style="--tier-color: ${tierColor}">
              <span class="profile__tier-icon" aria-hidden="true">${getTierIcon(tier)}</span>
              <span class="profile__tier-name">${tier}</span>
            </div>
            <div class="profile__stats">
              <div class="stat">
                <span class="stat__value">${formatGamerscore(stats.gamerscore)}</span>
                <span class="stat__label">Gamerscore</span>
              </div>
              <div class="stat">
                <span class="stat__value">${formatNumber(stats.achievementsUnlocked)}</span>
                <span class="stat__label">Conquistas</span>
              </div>
              <div class="stat">
                <span class="stat__value">${stats.gamesPlayed}</span>
                <span class="stat__label">Jogos jogados</span>
              </div>
              <div class="stat">
                <span class="stat__value">${formatPlaytime(stats.totalPlaytime)}</span>
                <span class="stat__label">Tempo de jogo</span>
              </div>
            </div>
          </div>
          <div class="profile__actions">
            <button class="btn btn--secondary" id="edit-profile-btn" aria-label="Editar perfil">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Editar perfil
            </button>
            <button class="btn btn--icon" id="share-profile-btn" aria-label="Compartilhar perfil">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Profile Tabs -->
      <nav class="profile__tabs-nav" aria-label="Abas do perfil">
        <div class="tabs" id="profile-tabs" role="tablist" aria-orientation="horizontal"></div>
      </nav>

      <!-- Tab Panels Container -->
      <div class="profile__tab-panels" id="profile-tab-panels"></div>
    </div>
  `;

  // Initialize avatar
  initProfileAvatar(main);

  // Initialize tabs
  initProfileTabs(main);

  // Bind header actions
  bindHeaderActions(main);

  return { tabsInstance, avatarInstance, gameTileInstances };
}

function initProfileAvatar(main) {
  const container = $('#profile-avatar', main);
  if (!container || !currentUser) return;

  avatarInstance = initAvatar(container, {
    src: currentUser.avatar,
    alt: currentUser.name,
    fallback: currentUser.name,
    size: '2xl',
    editable: true,
    ring: true,
    status: currentUser.status,
    onEdit: (dataUrl, file) => updateAvatar(dataUrl),
  });
}

function initProfileTabs(main) {
  const tabsContainer = $('#profile-tabs', main);
  const panelsContainer = $('#profile-tab-panels', main);
  if (!tabsContainer || !panelsContainer) return;

  const tabsConfig = [
    {
      label: 'Visão geral',
      id: 'overview',
      content: '',
    },
    {
      label: 'Conquistas',
      id: 'achievements',
      content: '',
    },
    {
      label: 'Jogos',
      id: 'games',
      content: '',
    },
    {
      label: 'Amigos',
      id: 'friends',
      content: '',
    },
    {
      label: 'Atividade',
      id: 'activity',
      content: '',
    },
  ];

  tabsInstance = initTabs(tabsContainer, {
    tabs: tabsConfig,
    defaultIndex: 0,
    onChange: (index, trigger, panel) => {
      const tabId = tabsConfig[index].id;
      renderTabContent(tabId, panelsContainer);
    },
  });

  // Render initial tab
  renderTabContent('overview', panelsContainer);
}

function renderTabContent(tabId, container) {
  const skeletonId = `profile-${tabId}-skeleton`;
  skeletonInstances.set(skeletonId, initSkeleton(container, { variant: tabId === 'games' ? 'card' : 'text', rows: tabId === 'games' ? 2 : 4 }));

  setTimeout(() => {
    const skeleton = skeletonInstances.get(skeletonId);
    if (skeleton) skeleton.skeleton.hidden = true;

    switch (tabId) {
      case 'overview':
        renderOverview(container);
        break;
      case 'achievements':
        renderAchievements(container);
        break;
      case 'games':
        renderGames(container);
        break;
      case 'friends':
        renderFriends(container);
        break;
      case 'activity':
        renderActivity(container);
        break;
    }
  }, 200);
}

function renderOverview(container) {
  const stats = getUserStats();
  const recentAchievements = getUserAchievements(5);
  const recentGames = getUserStats().recentGames || [];

  container.innerHTML = `
    <div class="profile__overview">
      <!-- Recent Achievements -->
      <section class="profile__section" aria-labelledby="recent-achievements-title">
        <header class="profile__section-header">
          <h2 id="recent-achievements-title" class="profile__section-title">Conquistas recentes</h2>
          <a href="#profile?tab=achievements" class="btn btn--ghost btn--sm">Ver todas</a>
        </header>
        <div class="profile__achievements-list" id="recent-achievements">
          ${recentAchievements.length > 0 ? recentAchievements.map(a => `
            <article class="achievement achievement--unlocked">
              <div class="achievement__icon">
                <img src="${a.icon}" alt="" width="48" height="48" loading="lazy">
              </div>
              <div class="achievement__info">
                <h4 class="achievement__name">${a.name}</h4>
                <p class="achievement__game">${a.gameTitle}</p>
                <div class="achievement__meta">
                  <span class="achievement__gamerscore">${a.gamerscore}G</span>
                  <time class="achievement__unlocked" datetime="${a.unlockedAt}">${formatDate(a.unlockedAt)}</time>
                  ${a.rare ? '<span class="achievement__rare">Rara</span>' : ''}
                </div>
              </div>
            </article>
          `).join('') : '<p class="profile__empty">Nenhuma conquista recente.</p>'}
        </div>
      </section>

      <!-- Recently Played -->
      <section class="profile__section" aria-labelledby="recent-games-title">
        <header class="profile__section-header">
          <h2 id="recent-games-title" class="profile__section-title">Jogados recentemente</h2>
          <a href="#profile?tab=games" class="btn btn--ghost btn--sm">Ver todos</a>
        </header>
        <div class="game-row" id="recent-games-row" role="list" aria-label="Jogados recentemente"></div>
      </section>

      <!-- Completion Stats -->
      <section class="profile__section profile__completion" aria-labelledby="completion-title">
        <h2 id="completion-title" class="profile__section-title">Progresso de conclusão</h2>
        <div class="profile__completion-grid">
          <div class="completion-card">
            <div class="progress-ring" id="completion-ring" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Porcentagem de conclusão média"></div>
            <div class="completion-card__info">
              <span class="completion-card__value" id="completion-value">0%</span>
              <span class="completion-card__label">Conclusão média</span>
            </div>
          </div>
          <div class="completion-card">
            <div class="completion-card__info">
              <span class="completion-card__value">${stats.gamesCompleted || 0}</span>
              <span class="completion-card__label">Jogos completados (100%)</span>
            </div>
          </div>
          <div class="completion-card">
            <div class="completion-card__info">
              <span class="completion-card__value">${stats.gamesMastered || 0}</span>
              <span class="completion-card__label">Jogos masterizados</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  // Initialize completion ring
  const completionRing = $('#completion-ring', container);
  if (completionRing) {
    const avgCompletion = stats.averageCompletion || 0;
    initProgressRing(completionRing, {
      value: avgCompletion,
      max: 100,
      size: 'xl',
      strokeWidth: 8,
      showValue: true,
      formatValue: v => `${Math.round(v)}%`,
    });
    const completionValue = $('#completion-value', container);
    if (completionValue) completionValue.textContent = `${Math.round(avgCompletion)}%`;
  }

  // Load recent games
  loadRecentGames();
}

function loadRecentGames() {
  const container = $('#recent-games-row');
  if (!container) return;

  const recentGames = getUserStats().recentGames || [];

  recentGames.slice(0, 6).forEach((game, index) => {
    const tileContainer = createEl('div', { class: 'game-tile-wrapper', role: 'listitem' });
    container.appendChild(tileContainer);

    const instance = initGameTile(tileContainer, {
      game,
      variant: 'default',
      size: 'md',
      showProgress: true,
      onClick: () => navigateToGame(game.id),
    });

    gameTileInstances.set(`recent-${game.id}`, instance);
  });
}

function renderAchievements(container) {
  const achievements = getUserAchievements();
  const stats = getUserStats();

  container.innerHTML = `
    <div class="profile__achievements">
      <!-- Summary -->
      <div class="profile__achievements-summary">
        <div class="progress-ring" id="achievements-progress-ring" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso total de conquistas"></div>
        <div class="profile__achievements-stats">
          <div class="stat">
            <span class="stat__value">${stats.achievementsUnlocked}/${stats.achievementsTotal}</span>
            <span class="stat__label">Desbloqueadas</span>
          </div>
          <div class="stat">
            <span class="stat__value">${formatGamerscore(stats.gamerscore)}/${formatGamerscore(stats.maxGamerscore)}</span>
            <span class="stat__label">Gamerscore</span>
          </div>
          <div class="stat">
            <span class="stat__value">${Math.round((stats.achievementsUnlocked / stats.achievementsTotal) * 100)}%</span>
            <span class="stat__label">Conclusão</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="profile__achievements-filters">
        <button class="btn btn--sm ${'all' === 'all' ? 'btn--active' : ''}" data-filter="all" aria-pressed="true">Todas</button>
        <button class="btn btn--sm" data-filter="unlocked" aria-pressed="false">Desbloqueadas</button>
        <button class="btn btn--sm" data-filter="locked" aria-pressed="false">Bloqueadas</button>
        <button class="btn btn--sm" data-filter="rare" aria-pressed="false">Raras</button>
      </div>

      <!-- List -->
      <div class="profile__achievements-list" id="achievements-list">
        ${achievements.map(a => `
          <article class="achievement ${a.unlocked ? 'achievement--unlocked' : 'achievement--locked'}" data-filter="${a.unlocked ? 'unlocked' : 'locked'} ${a.rare ? 'rare' : ''}">
            <div class="achievement__icon">
              ${a.unlocked
                ? `<img src="${a.icon}" alt="" width="64" height="64" loading="lazy">`
                : `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="8" y="8" width="48" height="48" rx="8" /><path d="M20 32l8 8 16-16" /></svg>`
              }
            </div>
            <div class="achievement__info">
              <h4 class="achievement__name">${a.name}</h4>
              <p class="achievement__description">${a.description}</p>
              <div class="achievement__meta">
                <span class="achievement__game">${a.gameTitle}</span>
                <span class="achievement__gamerscore">${a.gamerscore}G</span>
                ${a.unlocked ? `<time class="achievement__unlocked" datetime="${a.unlockedAt}">${formatDate(a.unlockedAt)}</time>` : ''}
                ${a.rare ? '<span class="achievement__rare">Rara</span>' : ''}
              </div>
            </div>
          </article>
        `).join('')}
      </div>
    </div>
  `;

  // Initialize progress ring
  const progressRing = $('#achievements-progress-ring', container);
  if (progressRing) {
    const percentage = Math.round((stats.achievementsUnlocked / stats.achievementsTotal) * 100);
    initProgressRing(progressRing, {
      value: percentage,
      max: 100,
      size: 'xl',
      strokeWidth: 8,
      showValue: true,
      formatValue: v => `${v}%`,
    });
  }

  // Bind filter buttons
  container.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      container.querySelectorAll('[data-filter]').forEach(b => {
        b.classList.toggle('btn--active', b.dataset.filter === filter);
        b.setAttribute('aria-pressed', b.dataset.filter === filter);
      });
      filterAchievements(container, filter);
    });
  });
}

function filterAchievements(container, filter) {
  const items = container.querySelectorAll('#achievements-list .achievement');
  items.forEach(item => {
    const filters = item.dataset.filter.split(' ');
    const show = filter === 'all' || filters.includes(filter);
    item.style.display = show ? '' : 'none';
  });
}

function renderGames(container) {
  const stats = getUserStats();
  const games = stats.allGames || [];

  container.innerHTML = `
    <div class="profile__games">
      <div class="profile__games-stats">
        <div class="stat">
          <span class="stat__value">${games.length}</span>
          <span class="stat__label">Total de jogos</span>
        </div>
        <div class="stat">
          <span class="stat__value">${games.filter(g => g.installed).length}</span>
          <span class="stat__label">Instalados</span>
        </div>
        <div class="stat">
          <span class="stat__value">${formatPlaytime(stats.totalPlaytime)}</span>
          <span class="stat__label">Tempo total</span>
        </div>
      </div>
      <div class="game-row" id="profile-games-row" role="list" aria-label="Todos os jogos"></div>
    </div>
  `;

  const gamesContainer = $('#profile-games-row', container);
  if (gamesContainer) {
    games.forEach(game => {
      const tileContainer = createEl('div', { class: 'game-tile-wrapper', role: 'listitem' });
      gamesContainer.appendChild(tileContainer);

      const instance = initGameTile(tileContainer, {
        game,
        variant: 'default',
        size: 'md',
        showProgress: true,
        showPlaytime: true,
        onClick: () => navigateToGame(game.id),
      });

      gameTileInstances.set(`profile-game-${game.id}`, instance);
    });
  }
}

function renderFriends(container) {
  const friends = getFriends();

  container.innerHTML = `
    <div class="profile__friends">
      <div class="profile__friends-header">
        <h2 class="profile__section-title">${friends.length} amigo${friends.length !== 1 ? 's' : ''}</h2>
        <button class="btn btn--secondary btn--sm" id="add-friend-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
          Adicionar amigo
        </button>
      </div>
      <div class="profile__friends-list" id="friends-list">
        ${friends.map(friend => `
          <article class="friend-card" data-status="${friend.status}">
            <div class="friend-card__avatar" data-avatar="${friend.id}"></div>
            <div class="friend-card__info">
              <div class="friend-card__name-row">
                <span class="friend-card__name">${friend.name}</span>
                <span class="friend-card__gamertag">${friend.gamertag}</span>
              </div>
              <div class="friend-card__meta">
                <span class="friend-card__status friend-card__status--${friend.status}">${getStatusLabel(friend.status)}</span>
                ${friend.currentGame ? `<span class="friend-card__playing">Jogando ${friend.currentGame}</span>` : ''}
              </div>
            </div>
            <div class="friend-card__actions">
              ${friend.status === 'online' ? `
                <button class="btn btn--icon btn--sm" aria-label="Convidar para jogar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg></button>
                <button class="btn btn--icon btn--sm" aria-label="Entrar na party"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></button>
              ` : ''}
              <button class="btn btn--icon btn--sm" aria-label="Ver perfil"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg></button>
            </div>
          </article>
        `).join('')}
      </div>
    </div>
  `;

  // Initialize friend avatars
  friends.forEach(friend => {
    const avatarContainer = $(`[data-avatar="${friend.id}"]`, container);
    if (avatarContainer) {
      initAvatar(avatarContainer, {
        src: friend.avatar,
        alt: friend.name,
        fallback: friend.name,
        size: 'md',
        status: friend.status,
        ring: true,
      });
    }
  });
}

function renderActivity(container) {
  const activities = getRecentActivity(20);

  container.innerHTML = `
    <div class="profile__activity">
      <div class="profile__activity-list" id="activity-list">
        ${activities.map(activity => `
          <article class="activity-item activity-item--${activity.type}">
            <div class="activity-item__icon" aria-hidden="true">
              ${getActivityIcon(activity.type)}
            </div>
            <div class="activity-item__content">
              <p class="activity-item__text">${activity.text}</p>
              <time class="activity-item__time" datetime="${activity.timestamp}">${formatDate(activity.timestamp)}</time>
            </div>
            ${activity.game ? `
              <div class="activity-item__game">
                <img src="${activity.game.cover}" alt="" width="48" height="64" loading="lazy">
                <span class="activity-item__game-name">${activity.game.title}</span>
              </div>
            ` : ''}
          </article>
        `).join('')}
      </div>
    </div>
  `;
}

function getStatusLabel(status) {
  const labels = { online: 'Online', away: 'Ausente', offline: 'Offline', busy: 'Ocupado' };
  return labels[status] || status;
}

function getActivityIcon(type) {
  const icons = {
    achievement: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" /></svg>',
    game_start: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><polygon points="5 3 19 12 5 21 5 3" /></svg>',
    game_complete: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>',
    friend_online: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>',
    screenshot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>',
  };
  return icons[type] || icons.game_start;
}

function getTierIcon(tier) {
  const icons = {
    Bronze: '🥉',
    Silver: '🥈',
    Gold: '🥇',
    Diamond: '💎',
    Onyx: '⚫',
  };
  return icons[tier] || '🏅';
}

function bindHeaderActions(main) {
  const editBtn = $('#edit-profile-btn', main);
  editBtn?.addEventListener('click', () => {
    import('../components/modal.js').then(({ prompt }) => {
      prompt('Editar perfil', 'Nome:', currentUser?.name || '', (name) => {
        if (name) {
          import('../components/toast.js').then(({ success }) => {
            success('Perfil atualizado', 'Perfil');
          });
        }
      });
    });
  });

  const shareBtn = $('#share-profile-btn', main);
  shareBtn?.addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({
        title: `Perfil de ${currentUser?.name}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      import('../components/toast.js').then(({ success }) => {
        success('Link do perfil copiado', 'Perfil');
      });
    }
  });
}

function navigateToGame(gameId) {
  window.location.hash = `#game/${gameId}`;
}

function updateAvatar(dataUrl) {
  if (currentUser) {
    currentUser.avatar = dataUrl;
    storage.set('user-avatar', dataUrl);
    import('../components/toast.js').then(({ success }) => {
      success('Avatar atualizado', 'Perfil');
    });
  }
}

export function cleanup() {
  currentUser = null;
  tabsInstance = null;
  avatarInstance = null;
  gameTileInstances.clear();
  skeletonInstances.clear();
}

export default { render, cleanup };