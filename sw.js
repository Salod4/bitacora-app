const CACHE_NAME = 'bitacora-v2';
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
  var url = event.request.url;

  // Network-first for the Chart.js CDN script so it stays current when online.
  if (url.indexOf('cdnjs.cloudflare.com') !== -1) {
    event.respondWith(
      fetch(event.request).catch(function(){ return caches.match(event.request); })
    );
    return;
  }

  // Network-first for the HTML shell (navigations + index.html) so a code update
  // shows up on the very next reload instead of getting stuck behind an old cache
  // until sw.js itself happens to change. Falls back to cache only when offline.
  var isHtmlShell = event.request.mode === 'navigate' || url.indexOf('index.html') !== -1 || url.endsWith('/');
  if (isHtmlShell) {
    event.respondWith(
      fetch(event.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        return res;
      }).catch(function(){ return caches.match(event.request); })
    );
    return;
  }

  // Cache-first for static assets (icons, manifest) so the shell still works offline.
  event.respondWith(
    caches.match(event.request).then(function(cached){
      return cached || fetch(event.request).catch(function(){ return cached; });
    })
  );
});
