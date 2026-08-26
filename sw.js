const CACHE_NAME = 'bitacora-v1';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(SHELL_ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  // Network-first for the Chart.js CDN script so it stays current when online;
  // cache-first for everything else so the app shell works offline.
  if (event.request.url.indexOf('cdnjs.cloudflare.com') !== -1) {
    event.respondWith(
      fetch(event.request).catch(function(){ return caches.match(event.request); })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function(cached){
      return cached || fetch(event.request).catch(function(){ return cached; });
    })
  );
});
