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
  './shortcuts.js',
  './onboarding.js',
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

// Network-first for the app shell, falling back to cache only when offline
// — deliberately NOT cache-first. This was tried first and caught a real
// bug during Phase 7b verification: cache-first means once a file (e.g.
// shortcuts.js) is cached, every future edit to that file keeps getting
// silently ignored forever, because a cache hit never even asks the
// network. That directly conflicts with this project's actual maintenance
// model — README's "How to update weekly" section is built entirely
// around editing elements.js (and, now, other JS files) and expecting
// players to see the change on their next visit. Network-first fixes that:
// online, every request goes to the network first and the cache is
// refreshed with whatever comes back, so a returning player always gets
// the latest shipped code; only when the network genuinely fails (offline)
// does it fall back to the last-known-good cached copy, and navigations
// additionally fall back to the cached index.html shell if even that's
// missing. Only handles same-origin GET requests; nothing else in this
// app makes any other kind of request.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    // `fetch(req)` alone still consults the browser's own HTTP cache layer
    // (separate from the Cache API above) and can silently return a stale
    // disk-cached response even though this handler intends to always hit
    // the network — caught during Phase 7c verification when an edited
    // effects.js/audio.js kept showing OLD behavior in a tab that had
    // loaded them once before, despite this being a "network-first"
    // handler. `cache: 'reload'` forces a true network round-trip every
    // time, which is exactly what "network-first" is supposed to mean.
    fetch(req, { cache: 'reload' })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => {
        return caches.match(req).then((cached) => {
          if (cached) return cached;
          if (req.mode === 'navigate') return caches.match('./index.html');
          return undefined;
        });
      })
  );
});
