// So Spill Service Worker — caches core assets for offline use
const CACHE = 'vent-app-v1';
const ASSETS = [
  '/vent-app/index.html',
  '/vent-app/vent-engine.js',
  '/vent-app/manifest.json',
  '/vent-app/icon-192.png',
  '/vent-app/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
