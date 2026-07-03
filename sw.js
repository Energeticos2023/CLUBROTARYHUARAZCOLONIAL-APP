const CACHE_NAME='rotary-huaraz-v10';
const ASSETS=['./','./index.html','./styles.css?v=10','./app.js?v=10','./data.js?v=10','./manifest.webmanifest','./assets/logo_rotary_huaraz_colonial.png?v=10','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE_NAME?caches.delete(k):null))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))});
