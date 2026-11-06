const CACHE_NAME = "kalta-pwa-v2";
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./styles.css",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { body: event.data.text() };
    }
  }

  const title = payload.title || "KALTA";
  const body = payload.body || "You have a new notification.";
  const options = {
    body,
    icon: payload.icon || "./icons/icon-192.png",
    badge: payload.badge || "./icons/icon-192.png",
    tag: payload.tag || "kalta-notification",
    data: { url: payload.url || "./index.html", title, body, ...(payload.data || {}) }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || "./index.html",
    self.registration.scope
  );
  target.searchParams.set("notificationTitle", event.notification.data?.title || "KALTA");
  target.searchParams.set("notificationBody", event.notification.data?.body || "You have a new notification.");
  const targetUrl = target.href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ("focus" in client && "navigate" in client) return client.navigate(targetUrl).then(() => client.focus());
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});