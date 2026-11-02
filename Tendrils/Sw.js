// Service worker: caches the app so it opens instantly and works offline.
// Bump CACHE when you change any file so installed copies pick up the update.
const CACHE = "velsten-v1";
const FILES = [
  "./",
  "./vesselscroll.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Serve from cache right away, and refresh the cache in the background
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fresh = fetch(event.request)
        .then(res => {
          if (res && res.ok && new URL(event.request.url).origin === location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(event.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
