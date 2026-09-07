/**
 * ChordFlow Service Worker (PWA Offline Engine)
 * Version: 1.0.0
 */

const CACHE_NAME = 'chordflow-v1.0.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/main.css',
  './dist/main.js',
  './dist/audio.js',
  './dist/analytics.js',
  './dist/chord.js',
  './dist/db.js',
  './dist/diagrams.js',
  './dist/export.js',
  './dist/instruments.js',
  './dist/progression.js',
  './dist/theory.js',
  './dist/tuner.js',
  './dist/ui.js',
  './dist/types.js',
  './data/chords.json',
  './data/instruments.json',
  './data/progressions.json',
  './data/strumPatterns.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Install Event: Pre-cache all essential application assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching ChordFlow app shell and assets...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[ServiceWorker] Pre-caching complete. Skip waiting.');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.warn('[ServiceWorker] Pre-caching warning:', err);
      })
  );
});

// Activate Event: Clean up outdated cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[ServiceWorker] Purging stale cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Claiming clients for immediate control.');
      return self.clients.claim();
    })
  );
});

// Fetch Event: Cache-First strategy with Network Fallback & Runtime Caching
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached asset immediately
          // Fetch updated version in background to update cache for next time
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => {
              // Offline - ignore network error since we served cached copy
            });

          return cachedResponse;
        }

        // Not in cache: fetch from network and dynamically cache
        return fetch(event.request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseToCache));

            return networkResponse;
          })
          .catch(() => {
            // If fetching navigation page while offline, fallback to root index.html
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});
