const CACHE_NAME = 'waveping-shell-v13';
const APP_FILES = ['./', './index.html', './translator.html', './manifest.json', './icon.svg', './KALTA6.jpg', './ScrollWheel.wav'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Always check the network first so GitHub Pages updates reach installed PWAs.
  const freshRequest = new Request(event.request, { cache: 'no-store' });
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(freshRequest);
      if (response.ok) {
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await cache.match(event.request);
      return cached || Response.error();
    }
  })());
});