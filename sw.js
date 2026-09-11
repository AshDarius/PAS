const CACHE_NAME = 'pas-offline-v1';

const OFFLINE_FILES = [
    './',
    './index.html',
    './manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(OFFLINE_FILES);
        })
    );

    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );

    self.clients.claim();
});

self.addEventListener('fetch', event => {

    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(

        // ONLINE: always try the network first
        fetch(event.request)
            .then(response => {

                // Save the newest version for future offline use
                if (response.ok) {
                    const copy = response.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, copy);
                    });
                }

                return response;
            })

            // OFFLINE: use the cached version
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
