/**
 * FlatLedger Service Worker
 *
 * Strategy:
 *  - Static assets (JS/CSS/fonts/images): Cache-first, falling back to network.
 *  - Navigation requests (HTML): Network-first, falling back to cached /index.html.
 *  - API requests: Network-only (never cache sensitive financial data).
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `flatledger-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `flatledger-dynamic-${CACHE_VERSION}`;

/** Core app shell — always cached on install */
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-icon.png',
];

// ---------------------------------------------------------------------------
// Install — pre-cache the app shell
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

// ---------------------------------------------------------------------------
// Activate — purge caches from previous versions
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  const allowedCaches = new Set([STATIC_CACHE, DYNAMIC_CACHE]);

  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !allowedCaches.has(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// Fetch — route requests to the correct strategy
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin and navigation requests
  if (request.method !== 'GET') return;

  // Never intercept API calls — always go to the network
  if (url.pathname.startsWith('/api/') || !isSameOriginOrCDN(url)) {
    return;
  }

  // Navigation requests → Network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Static assets (hashed filenames from Vite build) → Cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Everything else → Stale-while-revalidate into dynamic cache
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ---------------------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------------------

/**
 * Cache-first: serve from cache; if missing, fetch, cache, and return.
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline — resource unavailable.', { status: 503 });
  }
}

/**
 * Network-first: try the network; on failure serve the cached /index.html
 * so the SPA router can render the offline state.
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request) || await caches.match('/index.html');
    if (cached) return cached;

    return new Response(
      '<!doctype html><html><head><meta charset="utf-8"><title>FlatLedger — Offline</title></head>' +
      '<body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">' +
      '<div style="text-align:center"><h1 style="font-size:1.5rem;font-weight:600">You are offline</h1>' +
      '<p style="color:#64748b">Please check your internet connection and try again.</p></div></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

/**
 * Stale-while-revalidate: serve from cache immediately and refresh in the
 * background so the next visit gets fresh content.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || fetchPromise || new Response('Offline', { status: 503 });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Vite emits assets with content-hash filenames under /assets/ */
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    /\.(png|jpe?g|svg|webp|ico|woff2?|ttf|otf|eot)$/.test(url.pathname)
  );
}

function isSameOriginOrCDN(url) {
  return url.origin === self.location.origin;
}
