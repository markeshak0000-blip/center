const CACHE_NAME = 'st-george-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/style.css',
  './assets/js/storage.js',
  './assets/js/utils.js',
  './assets/js/auth.js',
  './assets/js/students.js',
  './assets/js/teachers.js',
  './assets/js/groups.js',
  './assets/js/attendance.js',
  './assets/js/subscriptions.js',
  './assets/js/expenses.js',
  './assets/js/reports.js',
  './assets/js/backup.js',
  './assets/js/app.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CORE_ASSETS).catch(err => {
        console.log('Cache addAll error', err);
        // Try to cache individually
        return Promise.all(CORE_ASSETS.map(url => 
          cache.add(url).catch(e => console.log('Failed to cache', url))
        ));
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Cache first, then network, with network fallback for CDN
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache CDN assets like xlsx
        if (event.request.url.includes('xlsx') || event.request.url.includes('cdn.jsdelivr')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
