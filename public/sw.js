/**
 * Service Worker for ANATECH MARKET Uganda
 * Provides offline caching for application shell, static assets, images, and API data.
 */

const STATIC_CACHE = 'anatech-static-v2';
const IMAGES_CACHE = 'anatech-images-v2';
const DATA_CACHE = 'anatech-data-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// Maximum cached images to prevent storage exhaustion on low-end mobile devices
const MAX_CACHED_IMAGES = 120;

// Installation: Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Core asset caching partial error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activation: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (![STATIC_CACHE, IMAGES_CACHE, DATA_CACHE].includes(key)) {
            console.log('[SW] Deleting deprecated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Trim cache size
async function trimCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      await cache.delete(keys[0]);
      trimCache(cacheName, maxItems);
    }
  } catch (err) {
    console.warn('[SW] trimCache error:', err);
  }
}

// Fetch interception
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests or chrome-extension URLs
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 1. Image Requests (Unsplash, local asset images, icons)
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/i) ||
    url.hostname.includes('images.unsplash.com')
  ) {
    event.respondWith(
      caches.open(IMAGES_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          // Stale-while-revalidate in background if online
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
              trimCache(IMAGES_CACHE, MAX_CACHED_IMAGES);
            }
          }).catch(() => {
            // Quietly ignore background network failure while offline
          });
          return cachedResponse;
        }

        // Not in cache: fetch from network
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            cache.put(request, networkResponse.clone());
            trimCache(IMAGES_CACHE, MAX_CACHED_IMAGES);
          }
          return networkResponse;
        } catch (fetchErr) {
          // If completely offline and image not in cache, fallback to SVG icon if applicable
          if (request.destination === 'image') {
            const fallback = await cache.match('/icon.svg');
            if (fallback) return fallback;
          }
          throw fetchErr;
        }
      })
    );
    return;
  }

  // 2. API Data Requests (/api/listings, /api/categories, /api/districts, etc.)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(DATA_CACHE);
        try {
          // Try network with a 2.5 second timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          const networkResponse = await fetch(request, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          }
        } catch (netErr) {
          console.log('[SW] Network failed or offline for API, serving cached data:', url.pathname);
        }

        // Fallback to cached API response
        const cached = await cache.match(request);
        if (cached) {
          return cached;
        }

        // If no cache and network failed, return synthetic JSON offline response
        return new Response(JSON.stringify({
          offline: true,
          message: 'Device is offline. Serving local storage data.',
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        });
      })()
    );
    return;
  }

  // 3. Navigation requests (HTML SPA documents)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cachedIndex = await cache.match('/index.html') || await cache.match('/');
        if (cachedIndex) return cachedIndex;
        return new Response('<html><body><h1>ANATECH MARKET</h1><p>You are currently offline. Please reconnect.</p></body></html>', {
          headers: { 'Content-Type': 'text/html' }
        });
      })
    );
    return;
  }

  // 4. Static script / style assets (Vite bundle JS, CSS, Google fonts)
  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) {
        // Return cached and update in background if online
        fetch(request).then(async (fresh) => {
          if (fresh && fresh.status === 200) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, fresh);
          }
        }).catch(() => {});
        return cached;
      }

      // Not in cache, fetch and cache
      return fetch(request).then(async (response) => {
        if (response && response.status === 200) {
          const cache = await caches.open(STATIC_CACHE);
          cache.put(request, response.clone());
        }
        return response;
      }).catch(async (err) => {
        // Fallback for failed asset
        if (request.destination === 'document') {
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
        }
        throw err;
      });
    })
  );
});

// Client PostMessage handler for manual sync / precache requests
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CACHE_IMAGES') {
    const urls = event.data.urls || [];
    caches.open(IMAGES_CACHE).then((cache) => {
      urls.forEach((url) => {
        fetch(url, { mode: 'no-cors' }).then((res) => {
          cache.put(url, res);
        }).catch(() => {});
      });
    });
  }
});
