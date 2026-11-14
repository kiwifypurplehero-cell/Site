/**
 * Hash-based Router for SPA navigation
 * Supports route parameters, guards, and history management
 */

import { onReady, debounce } from './utils/dom.js';

// Route definitions
const routes = {
  '': { page: 'home', title: 'Início' },
  'home': { page: 'home', title: 'Início' },
  'library': { page: 'library', title: 'Biblioteca' },
  'store': { page: 'store', title: 'Loja' },
  'game': { page: 'game-detail', title: 'Jogo', hasParams: true },
  'profile': { page: 'profile', title: 'Perfil' },
  'settings': { page: 'settings', title: 'Configurações', hasParams: true },
};

const routeCallbacks = [];
let currentRoute = null;
let currentParams = {};
let routeGuards = [];

// Parse hash into route + params
function parseHash(hash) {
  const cleanHash = hash.replace(/^#/, '') || '';
  const parts = cleanHash.split('/');
  const routeKey = parts[0] || '';
  const params = {};

  const routeDef = routes[routeKey];
  if (routeDef?.hasParams && parts.length > 1) {
    params.id = parts.slice(1).join('/');
  }

  return { routeKey, routeDef, params };
}

// Match current hash to route
function matchRoute() {
  const hash = window.location.hash;
  const { routeKey, routeDef, params } = parseHash(hash);

  if (routeDef) {
    return { ...routeDef, params, hash: routeKey };
  }

  // 404 fallback
  return { page: '404', title: 'Não encontrado', params: {}, hash: '404' };
}

// Run route guards
async function runGuards(to, from) {
  for (const guard of routeGuards) {
    const result = await guard(to, from);
    if (result === false) return false;
    if (typeof result === 'string') {
      navigate(result);
      return false;
    }
  }
  return true;
}

// Navigate to a route
export async function navigate(hash, replace = false) {
  const cleanHash = hash.startsWith('#') ? hash : `#${hash}`;
  const to = parseHash(cleanHash).routeDef || { page: '404', title: 'Não encontrado' };
  const from = currentRoute;

  // Run guards
  const canProceed = await runGuards(to, from);
  if (!canProceed) return false;

  if (replace) {
    history.replaceState(null, '', cleanHash);
  } else {
    history.pushState(null, '', cleanHash);
  }

  return handleRouteChange();
}

// Handle route change (popstate or hashchange)
async function handleRouteChange() {
  const matched = matchRoute();
  const prevRoute = currentRoute;
  const prevParams = currentParams;

  currentRoute = matched;
  currentParams = matched.params;

  // Update document title
  document.title = `${matched.title} - XPGD`;

  // Notify callbacks
  for (const callback of routeCallbacks) {
    try {
      await callback(matched, prevRoute, matched.params, prevParams);
    } catch (err) {
      console.error('Route callback error:', err);
    }
  }

  // Update active nav
  updateActiveNav(matched.hash);

  return true;
}

// Update active navigation item
function updateActiveNav(activeHash) {
  document.querySelectorAll('.sidebar__item').forEach(item => {
    const itemHash = item.getAttribute('href')?.replace('#', '') || '';
    const isActive = itemHash === activeHash ||
                     (activeHash.startsWith('game/') && itemHash === 'library') ||
                     (activeHash.startsWith('settings/') && itemHash === 'settings');
    item.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

// Subscribe to route changes
export function onRoute(callback) {
  routeCallbacks.push(callback);
  // Call immediately with current route
  if (currentRoute) {
    callback(currentRoute, null, currentParams, {});
  }
  return () => {
    const idx = routeCallbacks.indexOf(callback);
    if (idx > -1) routeCallbacks.splice(idx, 1);
  };
}

// Get current route
export function getCurrentRoute() {
  return currentRoute;
}

// Get current route params
export function getParams() {
  return { ...currentParams };
}

// Add route guard
export function addRouteGuard(guard) {
  routeGuards.push(guard);
}

// Remove route guard
export function removeRouteGuard(guard) {
  const idx = routeGuards.indexOf(guard);
  if (idx > -1) routeGuards.splice(idx, 1);
}

// Generate URL for route
export function urlFor(routeKey, params = {}) {
  let hash = `#${routeKey}`;
  if (params.id) hash += `/${params.id}`;
  return hash;
}

// Initialize router
export async function initRouter() {
  await onReady();

  // Handle hash changes
  window.addEventListener('hashchange', handleRouteChange);

  // Handle popstate (browser back/forward)
  window.addEventListener('popstate', handleRouteChange);

  // Initial route
  await handleRouteChange();

  // Keyboard shortcut: Cmd/Ctrl + K for search
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const searchBtn = document.getElementById('search-btn');
      searchBtn?.click();
    }
  });
}

// Export router API
export const router = {
  navigate,
  onRoute,
  getCurrentRoute,
  getParams,
  addRouteGuard,
  removeRouteGuard,
  urlFor,
  init: initRouter,
};

export default router;