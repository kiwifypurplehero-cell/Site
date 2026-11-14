/**
 * Header Component - Top navigation bar with logo, search, notifications, user menu
 */

import { $, $$, createEl, onReady, debounce } from '../utils/dom.js';
import { navigate } from '../router.js';
import { openSearchModal } from '../app.js';

let headerEl = null;
let searchBtn = null;
let notificationsBtn = null;
let avatarEl = null;
let userMenuEl = null;
let notificationCount = 0;

export function init() {
  headerEl = $('.header');
  searchBtn = $('#search-btn');
  notificationsBtn = $('.header__btn[aria-label="Notificações"]');
  avatarEl = $('.header__avatar');

  if (!headerEl) return;

  bindEvents();
  updateNotificationBadge(0);
}

function bindEvents() {
  // Search button
  searchBtn?.addEventListener('click', () => {
    openSearchModal();
  });

  // Notifications button
  notificationsBtn?.addEventListener('click', toggleNotifications);

  // Avatar click - user menu
  avatarEl?.addEventListener('click', toggleUserMenu);

  // Close menus on outside click
  document.addEventListener('click', handleOutsideClick);

  // Keyboard navigation
  document.addEventListener('keydown', handleKeydown);
}

function handleOutsideClick(e) {
  if (userMenuEl && !userMenuEl.contains(e.target) && e.target !== avatarEl) {
    closeUserMenu();
  }
  if (notificationPanelEl && !notificationPanelEl.contains(e.target) && e.target !== notificationsBtn) {
    closeNotifications();
  }
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    closeUserMenu();
    closeNotifications();
  }
}

// Search is handled by app.js

// Notifications
let notificationPanelEl = null;

function toggleNotifications() {
  if (notificationPanelEl) {
    closeNotifications();
  } else {
    openNotifications();
  }
}

function openNotifications() {
  const notifications = getMockNotifications();
  notificationPanelEl = createEl('div', {
    class: 'notification-panel',
    role: 'region',
    'aria-label': 'Notificações',
  }, [
    createEl('header', { class: 'notification-panel__header' }, [
      createEl('h3', { class: 'notification-panel__title' }, 'Notificações'),
      createEl('button', {
        class: 'notification-panel__close',
        'aria-label': 'Fechar notificações',
        onclick: closeNotifications,
      }, createEl('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', width: '20', height: '20' }, [
        createEl('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
        createEl('line', { x1: '6', y1: '6', x2: '18', y2: '18' }),
      ])),
    ]),
    createEl('div', { class: 'notification-panel__list', role: 'list' }, notifications.map(n => createNotificationItem(n))),
    notifications.length === 0 && createEl('div', { class: 'notification-panel__empty' }, 'Nenhuma notificação'),
    createEl('footer', { class: 'notification-panel__footer' }, [
      createEl('a', { class: 'btn btn--ghost btn--sm', href: '#notifications' }, 'Ver todas'),
    ]),
  ]);

  document.body.appendChild(notificationPanelEl);

  // Position relative to button
  const rect = notificationsBtn.getBoundingClientRect();
  notificationPanelEl.style.position = 'fixed';
  notificationPanelEl.style.top = `${rect.bottom + 8}px`;
  notificationPanelEl.style.right = `${window.innerWidth - rect.right}px`;
  notificationPanelEl.style.zIndex = '500';
  notificationPanelEl.style.minWidth = '320px';
  notificationPanelEl.style.maxWidth = '400px';

  // Focus trap
  const focusable = notificationPanelEl.querySelectorAll('button, a, [href]');
  focusable[0]?.focus();

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', handleNotificationOutsideClick);
  }, 0);
}

function handleNotificationOutsideClick(e) {
  if (notificationPanelEl && !notificationPanelEl.contains(e.target) && e.target !== notificationsBtn) {
    closeNotifications();
    document.removeEventListener('click', handleNotificationOutsideClick);
  }
}

function closeNotifications() {
  notificationPanelEl?.remove();
  notificationPanelEl = null;
  document.removeEventListener('click', handleNotificationOutsideClick);
}

function getMockNotifications() {
  return [
    { id: 1, type: 'achievement', title: 'Conquista desbloqueada', message: 'Legendary Campaign em Halo Infinite', time: '2h atrás', read: false },
    { id: 2, type: 'friend', title: 'Amigo online', message: 'CortanaAI começou a jogar Forza Horizon 5', time: '5h atrás', read: false },
    { id: 3, type: 'update', title: 'Atualização disponível', message: 'Starfield v1.12.3 - Novos conteúdos', time: '1d atrás', read: true },
  ];
}

function createNotificationItem(n) {
  return createEl('div', {
    class: `notification-item ${!n.read ? 'notification-item--unread' : ''}`,
    role: 'listitem',
  }, [
    createEl('div', { class: 'notification-item__icon' }, getNotificationIcon(n.type)),
    createEl('div', { class: 'notification-item__content' }, [
      createEl('p', { class: 'notification-item__title' }, n.title),
      createEl('p', { class: 'notification-item__message' }, n.message),
    ]),
    createEl('time', { class: 'notification-item__time' }, n.time),
  ]);
}

function getNotificationIcon(type) {
  const icons = {
    achievement: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.98.98H4.98a.98.98 0 0 1-.98-.98v-2.34c0-.55.45-.98.98-.98h10.04c.53 0 .98.43.98.98z"/><path d="M18 6a6 6 0 0 1 0 12H6a6 6 0 0 1 0-12h12z"/></svg>',
    friend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    update: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  };
  return icons[type] || icons.update;
}

function updateNotificationBadge(count) {
  notificationCount = count;
  if (notificationsBtn) {
    let badge = notificationsBtn.querySelector('.notification-badge');
    if (count > 0) {
      if (!badge) {
        badge = createEl('span', { class: 'notification-badge' });
        notificationsBtn.appendChild(badge);
      }
      badge.textContent = count > 9 ? '9+' : count;
    } else if (badge) {
      badge.remove();
    }
  }
}

// User Menu
function toggleUserMenu() {
  if (userMenuEl) {
    closeUserMenu();
  } else {
    openUserMenu();
  }
}

function openUserMenu() {
  const userData = getUserData();
  userMenuEl = createEl('div', {
    class: 'user-menu',
    role: 'menu',
    'aria-label': 'Menu do usuário',
  }, [
    createEl('div', { class: 'user-menu__header' }, [
      createEl('img', { class: 'user-menu__avatar', src: userData.avatar, alt: '' }),
      createEl('div', { class: 'user-menu__info' }, [
        createEl('p', { class: 'user-menu__name' }, userData.username),
        createEl('p', { class: 'user-menu__gamerscore' }, `${formatNumber(userData.gamerscore)} G`),
      ]),
    ]),
    createEl('div', { class: 'user-menu__divider' }),
    createEl('div', { class: 'user-menu__items', role: 'none' }, [
      createMenuItem('Perfil', 'user', '#profile'),
      createMenuItem('Conquistas', 'trophy', '#profile?tab=achievements'),
      createMenuItem('Configurações', 'settings', '#settings'),
      createMenuItem('Sair', 'log-out', '#', { danger: true }),
    ]),
  ]);

  document.body.appendChild(userMenuEl);

  // Position relative to avatar
  const rect = avatarEl.getBoundingClientRect();
  userMenuEl.style.position = 'fixed';
  userMenuEl.style.top = `${rect.bottom + 8}px`;
  userMenuEl.style.right = `${window.innerWidth - rect.right}px`;
  userMenuEl.style.zIndex = '500';
  userMenuEl.style.minWidth = '240px';

  // Focus first item
  const firstItem = userMenuEl.querySelector('[role="menuitem"]');
  firstItem?.focus();

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', handleUserMenuOutsideClick);
  }, 0);
}

function handleUserMenuOutsideClick(e) {
  if (userMenuEl && !userMenuEl.contains(e.target) && e.target !== avatarEl) {
    closeUserMenu();
    document.removeEventListener('click', handleUserMenuOutsideClick);
  }
}

function closeUserMenu() {
  userMenuEl?.remove();
  userMenuEl = null;
  document.removeEventListener('click', handleUserMenuOutsideClick);
}

function createMenuItem(label, icon, href, options = {}) {
  const el = createEl(options.danger ? 'button' : 'a', {
    class: `user-menu__item ${options.danger ? 'user-menu__item--danger' : ''}`,
    role: 'menuitem',
    href: options.danger ? undefined : href,
    onclick: options.danger ? handleSignOut : undefined,
  }, [
    createEl('svg', { class: 'user-menu__item-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', width: '20', height: '20' }, getIconSvg(icon)),
    createEl('span', { class: 'user-menu__item-label' }, label),
  ]);

  if (!options.danger) {
    el.addEventListener('click', () => {
      closeUserMenu();
      if (href.startsWith('#')) navigate(href);
    });
  }

  return el;
}

function getIconSvg(name) {
  const icons = {
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.98.98H4.98a.98.98 0 0 1-.98-.98v-2.34c0-.55.45-.98.98-.98h10.04c.53 0 .98.43.98.98z"/><path d="M18 6a6 6 0 0 1 0 12H6a6 6 0 0 1 0-12h12z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  };
  return icons[name] || '';
}

function handleSignOut() {
  closeUserMenu();
  // In a real app, this would trigger auth logout
  announce('Saindo da conta...');
}

function getUserData() {
  // Import from data
  return {
    username: 'Spartan117',
    gamerscore: 48230,
    avatar: 'img/avatars/spartan.svg',
  };
}

function formatNumber(num) {
  return new Intl.NumberFormat('pt-BR').format(num);
}

// Public API
export function updateNotifications(count) {
  updateNotificationBadge(count);
}

export function getHeaderElement() {
  return headerEl;
}