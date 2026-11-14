/**
 * Sidebar Component - Collapsible navigation sidebar
 */

import { $, $$, createEl, onReady } from '../utils/dom.js';
import { navigate, onRoute } from '../router.js';
import { storage } from '../utils/storage.js';

let sidebarEl = null;
let collapseBtn = null;
let navItems = [];
let isCollapsed = false;

const NAV_ITEMS = [
  { id: 'home', label: 'Início', icon: 'home', href: '#home' },
  { id: 'library', label: 'Biblioteca', icon: 'library', href: '#library' },
  { id: 'store', label: 'Loja', icon: 'store', href: '#store' },
  { id: 'profile', label: 'Perfil', icon: 'profile', href: '#profile' },
  { id: 'settings', label: 'Configurações', icon: 'settings', href: '#settings' },
];

const ICONS = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  library: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  store: '<path d="M20 20v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8"/><path d="M4 20v-8a2 2 0 0 1 2-2h2"/><path d="M16 4h2a2 2 0 0 1 2 2v2"/><path d="M4 4h16v2"/>',
  profile: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
};

export function init() {
  sidebarEl = $('#sidebar');
  collapseBtn = $('#sidebar-collapse-btn');

  if (!sidebarEl) return;

  // Load collapsed state from storage
  isCollapsed = storage.get('sidebarCollapsed', false);
  if (isCollapsed) {
    sidebarEl.classList.add('sidebar--collapsed');
  }

  renderNav();
  bindEvents();

  // Listen for route changes
  onRoute(handleRouteChange);
}

function renderNav() {
  const navList = sidebarEl.querySelector('.sidebar__list');
  if (!navList) return;

  navList.innerHTML = '';

  navItems = NAV_ITEMS.map(item => {
    const li = createEl('li');
    const a = createEl('a', {
      class: 'sidebar__item',
      href: item.href,
      'data-page': item.id,
      'aria-current': 'false',
    }, [
      createEl('span', {
        class: 'sidebar__item-icon',
        innerHTML: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${ICONS[item.icon]}</svg>`,
      }),
      createEl('span', { class: 'sidebar__item-label' }, item.label),
    ]);

    a.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(item.href);
    });

    li.appendChild(a);
    navList.appendChild(li);
    return { element: a, id: item.id };
  });
}

function bindEvents() {
  // Collapse button
  collapseBtn?.addEventListener('click', toggleCollapse);

  // Keyboard navigation for collapsed state
  sidebarEl.addEventListener('keydown', handleKeydown);
}

function handleKeydown(e) {
  const activeItem = sidebarEl.querySelector('.sidebar__item[aria-current="page"]');
  if (!activeItem) return;

  const currentIndex = navItems.findIndex(item => item.element === activeItem);
  if (currentIndex === -1) return;

  let nextIndex = currentIndex;

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      nextIndex = Math.min(currentIndex + 1, navItems.length - 1);
      break;
    case 'ArrowUp':
      e.preventDefault();
      nextIndex = Math.max(currentIndex - 1, 0);
      break;
    case 'Home':
      e.preventDefault();
      nextIndex = 0;
      break;
    case 'End':
      e.preventDefault();
      nextIndex = navItems.length - 1;
      break;
    case 'Enter':
    case ' ':
      if (isCollapsed) {
        e.preventDefault();
        toggleCollapse();
        setTimeout(() => navItems[nextIndex].element.focus(), 150);
      }
      break;
    default:
      return;
  }

  if (nextIndex !== currentIndex) {
    navItems[nextIndex].element.focus();
  }
}

function toggleCollapse() {
  isCollapsed = !isCollapsed;
  sidebarEl.classList.toggle('sidebar--collapsed', isCollapsed);
  collapseBtn?.setAttribute('aria-expanded', !isCollapsed);
  storage.set('sidebarCollapsed', isCollapsed);
}

function handleRouteChange(route) {
  const activeHash = route.hash;
  navItems.forEach(({ element, id }) => {
    const isActive = id === activeHash ||
                      (activeHash.startsWith('game/') && id === 'library') ||
                      (activeHash.startsWith('settings/') && id === 'settings');
    element.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

export function getSidebarElement() {
  return sidebarEl;
}

export function isSidebarCollapsed() {
  return isCollapsed;
}

export function setSidebarCollapsed(collapsed) {
  if (collapsed !== isCollapsed) {
    toggleCollapse();
  }
}