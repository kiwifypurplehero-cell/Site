/**
 * App Bootstrap - Main entry point
 * Initializes router, loads components, handles global state
 */

import { onReady, announce, trapFocus, prefersReducedMotion } from './utils/dom.js';
import { initRouter, navigate, onRoute, getCurrentRoute } from './router.js';
import { data } from './data.js';

// Import page modules
import { render as renderHome } from './pages/home.js';
import { render as renderLibrary } from './pages/library.js';
import { render as renderStore } from './pages/store.js';
import { render as renderGameDetail } from './pages/game-detail.js';
import { render as renderProfile } from './pages/profile.js';
import { render as renderSettings } from './pages/settings.js';
import { render as render404 } from './pages/404.js';

// Import shared components
import { init as initHeader, updateNotifications } from './components/header.js';
import { init as initSidebar } from './components/sidebar.js';
import { init as initSearchModal } from './components/search-modal.js';
import { init as initToast } from './components/toast.js';

// Global state
const state = {
  data,
  currentPage: null,
  pageCleanup: null,
  sidebarOpen: false,
  searchOpen: false,
};

// Page renderers map
const pageRenderers = {
  home: renderHome,
  library: renderLibrary,
  store: renderStore,
  'game-detail': renderGameDetail,
  profile: renderProfile,
  settings: renderSettings,
  404: render404,
};

// Initialize app
async function initApp() {
  await onReady();

  // Initialize router first
  await initRouter();

  // Initialize shared components
  initHeader();
  initSidebar();
  initSearchModal();
  initToast();

  // Set up route handler
  onRoute(handleRouteChange);

  // Global event listeners
  setupGlobalListeners();

  // Announce ready for screen readers
  announce('Xbox Purple Gaming Dashboard carregado');

  // Mark as initialized
  document.documentElement.classList.add('app-ready');
}

// Handle route changes
async function handleRouteChange(route, prevRoute, params, prevParams) {
  const pageName = route.page;

  // Cleanup previous page
  if (state.pageCleanup) {
    try { await state.pageCleanup(); } catch (e) { console.warn('Page cleanup error:', e); }
    state.pageCleanup = null;
  }

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('page--active'));

  // Show target page
  const pageEl = document.getElementById(`page-${pageName}`);
  if (pageEl) {
    pageEl.classList.add('page--active');
  }

  // Get renderer
  const renderer = pageRenderers[pageName];
  if (!renderer) {
    console.error(`No renderer for page: ${pageName}`);
    return;
  }

  // Get container
  const container = document.getElementById(`app-${pageName}`);
  if (!container) {
    console.error(`No container for page: ${pageName}`);
    return;
  }

  // Render new page
  try {
    state.currentPage = pageName;
    const cleanup = await renderer(container, params, state.data);
    state.pageCleanup = cleanup;
  } catch (err) {
    console.error(`Error rendering page ${pageName}:`, err);
    // Fallback to 404
    if (pageName !== '404') {
      await navigate('#404');
    }
  }

  // Close mobile sidebar on navigation
  closeSidebar();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

  // Announce page change
  const titles = {
    home: 'Início',
    library: 'Biblioteca',
    store: 'Loja',
    'game-detail': 'Detalhes do jogo',
    profile: 'Perfil',
    settings: 'Configurações',
    404: 'Página não encontrada',
  };
  announce(`Navegou para ${titles[pageName] || pageName}`);
}

// Set up global event listeners
function setupGlobalListeners() {
  // Sidebar toggle (mobile)
  const menuBtn = document.getElementById('menu-btn');
  const sidebar = document.getElementById('sidebar');
  const sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');

  menuBtn?.addEventListener('click', toggleSidebar);
  sidebarCollapseBtn?.addEventListener('click', toggleSidebarCollapse);

  // Close sidebar on overlay click (mobile)
  sidebar?.addEventListener('click', (e) => {
    if (e.target === sidebar) closeSidebar();
  });

  // Search button
  const searchBtn = document.getElementById('search-btn');
  searchBtn?.addEventListener('click', openSearchModal);

  // Keyboard: Escape closes modals/sidebar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.searchOpen) closeSearchModal();
      else if (state.sidebarOpen) closeSidebar();
    }
  });

  // Sidebar navigation clicks
  document.querySelectorAll('.sidebar__item').forEach(item => {
    item.addEventListener('click', (e) => {
      const href = item.getAttribute('href');
      if (href?.startsWith('#')) {
        e.preventDefault();
        navigate(href);
      }
    });
  });

  // Handle game card clicks (delegated)
  document.addEventListener('click', (e) => {
    const gameTile = e.target.closest('[data-game-id]');
    if (gameTile) {
      const gameId = gameTile.dataset.gameId;
      if (gameId) {
        e.preventDefault();
        navigate(`#game/${gameId}`);
      }
    }
  });
}

// Sidebar functions
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.getElementById('menu-btn');
  state.sidebarOpen = !state.sidebarOpen;
  sidebar?.classList.toggle('sidebar--mobile-open', state.sidebarOpen);
  menuBtn?.setAttribute('aria-expanded', state.sidebarOpen);
  if (state.sidebarOpen) {
    trapFocus(sidebar);
  }
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.getElementById('menu-btn');
  state.sidebarOpen = false;
  sidebar?.classList.remove('sidebar--mobile-open');
  menuBtn?.setAttribute('aria-expanded', 'false');
}

function toggleSidebarCollapse() {
  const sidebar = document.getElementById('sidebar');
  const btn = document.getElementById('sidebar-collapse-btn');
  const isCollapsed = sidebar?.classList.toggle('sidebar--collapsed');
  btn?.setAttribute('aria-expanded', !isCollapsed);
  // Persist preference
  localStorage.setItem('sidebarCollapsed', isCollapsed);
}

// Search Modal functions
function openSearchModal() {
  const modal = document.getElementById('search-modal');
  const input = modal?.querySelector('.search-modal__input');
  if (modal) {
    modal.showModal();
    state.searchOpen = true;
    input?.focus();
    trapFocus(modal);
  }
}

function closeSearchModal() {
  const modal = document.getElementById('search-modal');
  if (modal) {
    modal.close();
    state.searchOpen = false;
  }
}

// Export for debugging
window.__XPGD__ = {
  state,
  navigate,
  data,
  openSearchModal,
  closeSearchModal,
  toggleSidebar,
  closeSidebar,
};

// Initialize
initApp().catch(console.error);

export { initApp, navigate, state };