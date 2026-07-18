// Sandchemy — minimal service worker (Phase 7a, PWA installability)
//
// Purpose is narrow and deliberate: satisfy Chrome/Android's installability
// criteria (a fetch handler + a manifest) and let the static app shell load
// offline once visited once. This does NOT add any network calls, telemetry,
// or third-party requests of its own — it only ever caches files that are
// already shipped in this repo and already fetched by the browser normally.
// Zero-server, zero-leak promise (see README) is unaffected.

const CACHE_NAME = 'sandchemy-shell-v1';

// The static app shell — everything index.html needs to boot and run fully
// offline. Deliberately does NOT include about.html/privacy-policy.html
// (secondary pages, not part of the play experience) or the one-off
// generate_*.js dev scripts (not loaded by index.html at runtime).
const SHELL_FILES = [
  './',
  './index.html',
  './style.css',
  './elements.js',
  './lab.js',
  './game.js',
  './effects.js',
  './audio.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((name) => name !== CACHE_NAME)
             .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

// Cache-first for the app shell, falling back to network — and falling
// back further to whatever's cached for index.html if a navigation request
// fails entirely offline. Only handles same-origin GET requests; anything
// else (there shouldn't be anything else — no external requests exist in
// this app) passes straight through untouched.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // Opportunistically cache newly-seen same-origin files too, so a
          // second visit works offline even for anything not in the initial
          // shell list.
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => {
          if (req.mode === 'navigate') return caches.match('./index.html');
          return undefined;
        });
    })
  );
});
