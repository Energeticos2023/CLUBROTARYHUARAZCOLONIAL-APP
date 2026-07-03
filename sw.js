const CACHE_NAME = "rotary-huaraz-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=4",
  "./app.js?v=4",
  "./data.js?v=4",
  "./manifest.webmanifest",
  "./assets/logo_rotary_huaraz_colonial.png?v=4",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
