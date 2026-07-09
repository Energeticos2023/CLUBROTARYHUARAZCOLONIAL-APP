const CACHE_NAME = "rotary-huaraz-v21";
const ASSETS = [
  "./",
  "./index.html?v=21",
  "./styles.css?v=21",
  "./app.js?v=21",
  "./data.js?v=21",
  "./manifest.webmanifest",
  "./assets/logo_rotary_huaraz_colonial.png?v=21",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => null)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null)))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
