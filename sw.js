/* ===================== GOALBOUND — service worker: offline app shell ===================== */
'use strict';
// Bump this on every release so phones fetch the new files (old caches are deleted on activate)
const VERSION = 'goalbound-v3';
const SHELL = [
  './', './manifest.json',
  './css/base.css', './css/goalbound.css',
  './js/data.js', './js/core.js', './js/match.js', './js/career.js', './js/shell.js', './js/pwa.js'
];
// Cached when present, skipped silently when missing (icons arrive in a later step)
const OPTIONAL = [
  './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/icon-maskable-192.png', './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon.png', './assets/icons/favicon-32.png', './assets/icons/favicon-16.png'
];

// Install: download the whole app shell so the game works offline from the first launch
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL).then(() => Promise.all(OPTIONAL.map(u => c.add(u).catch(() => {}))))).then(() => self.skipWaiting()));
});

// Activate: remove caches from older versions and take control of open pages
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Fetch: cache first (instant + offline), refresh the cached copy in the background (stale-while-revalidate).
// Page navigations use the cached start page ('./', never a redirect); icons and other assets are cached the first time they load.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const isPage = req.mode === 'navigate';
  e.respondWith(caches.open(VERSION).then(async cache => {
    const key = isPage ? './' : req, hit = await cache.match(key, { ignoreSearch: true });
    const net = fetch(req).then(res => {
      if (res && res.ok && !res.redirected) cache.put(key, res.clone());
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || (isPage ? cache.match('./') : Response.error());
  }));
});
