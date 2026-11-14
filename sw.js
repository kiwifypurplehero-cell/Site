/**
 * Service Worker - PWA Offline Support
 * Caches app shell, assets, and API responses for offline usage
 */

const CACHE_NAME = 'xpgd-v1';
const STATIC_CACHE = 'xpgd-static-v1';
const DYNAMIC_CACHE = 'xpgd-dynamic-v1';
const IMAGE_CACHE = 'xpgd-images-v1';

// Assets to cache on install (app shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/404.html',
  '/manifest.json',
  '/css/tokens.css',
  '/css/reset.css',
  '/css/themes.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/utilities.css',
  '/css/print.css',
  '/js/app.js',
  '/js/router.js',
  '/js/data.js',
  '/js/utils/dom.js',
  '/js/utils/storage.js',
  '/js/utils/format.js',
  '/js/utils/a11y.js',
  '/js/utils/gamepad.js',
  '/js/components/button.js',
  '/js/components/game-tile.js',
  '/js/components/header.js',
  '/js/components/sidebar.js',
  '/js/components/hero-carousel.js',
  '/js/components/modal.js',
  '/js/components/dropdown.js',
  '/js/components/tabs.js',
  '/js/components/slider.js',
  '/js/components/toggle.js',
  '/js/components/avatar.js',
  '/js/components/badge.js',
  '/js/components/progress-ring.js',
  '/js/components/skeleton.js',
  '/js/components/tooltip.js',
  '/js/components/search-modal.js',
  '/js/components/toast.js',
  '/js/pages/home.js',
  '/js/pages/library.js',
  '/js/pages/store.js',
  '/js/pages/game-detail.js',
  '/js/pages/profile.js',
  '/js/pages/settings.js',
  '/js/pages/404.js',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== IMAGE_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Handle different types of requests
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isImageRequest(request)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
  } else if (isAPIRequest(url)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  } else if (isNavigationRequest(request)) {
    event.respondWith(navigationHandler(request));
  } else {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

// Check if request is for a static asset
function isStaticAsset(url) {
  return (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname === '/manifest.json'
  );
}

// Check if request is for an image
function isImageRequest(request) {
  return request.destination === 'image' ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico)(\?.*)?$/.test(request.url);
}

// Check if request is for API/data
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') ||
    url.pathname.endsWith('.json') && !url.pathname.endsWith('manifest.json');
}

// Check if request is a navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
    (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

// Cache-first strategy (for static assets)
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Cache-first fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy (for API requests)
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ error: 'Offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Stale-while-revalidate (for dynamic content)
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

// Navigation handler (for SPA routes)
async function navigationHandler(request) {
  const cache = await caches.open(STATIC_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      return response;
    }
  } catch (error) {
    // Ignore network errors for navigation
  }

  // Try to serve index.html for SPA routes
  const indexResponse = await cache.match('/index.html');
  if (indexResponse) {
    return indexResponse;
  }

  return new Response('Offline', { status: 503 });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-games') {
    event.waitUntil(syncGames());
  } else if (event.tag === 'sync-settings') {
    event.waitUntil(syncSettings());
  }
});

async function syncGames() {
  console.log('[SW] Syncing game data...');
  // Implement game data sync when online
}

async function syncSettings() {
  console.log('[SW] Syncing settings...');
  // Implement settings sync when online
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/img/icons/icon-192.svg',
    badge: '/img/icons/icon-72.svg',
    vibrate: [100, 50, 100],
    data: data.data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action) {
    // Handle action buttons
    console.log('[SW] Notification action:', event.action);
  } else {
    // Default click - open app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          }
          return clients.openWindow('/index.html');
        })
    );
  }
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  } else if (event.data === 'clearCache') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});

console.log('[SW] Service Worker loaded');