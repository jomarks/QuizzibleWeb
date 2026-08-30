const CACHE_VERSION = '1788115557'; // Will be replaced during build
const CACHE_NAME = `quizzible-${CACHE_VERSION}`;
const BASE_PATH = '';

// Files to cache immediately
const urlsToCache = ['/', '/index.html', '/favicon.ico'];

// Install event - cache essential files
// eslint-disable-next-line no-undef
self.addEventListener('install', event => {
  console.log('Service Worker installing with cache:', CACHE_NAME);
  event.waitUntil(
    // eslint-disable-next-line no-undef
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Cache install failed:', err);
      })
  );
  // Force the waiting service worker to become the active service worker
  // eslint-disable-next-line no-undef
  self.skipWaiting();
});

// Activate event - clean up old caches
// eslint-disable-next-line no-undef
self.addEventListener('activate', event => {
  console.log('Service Worker activating with cache:', CACHE_NAME);
  event.waitUntil(
    // eslint-disable-next-line no-undef
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            // eslint-disable-next-line no-undef
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  // eslint-disable-next-line no-undef
  return self.clients.claim();
});

// Listen for messages from the client
// eslint-disable-next-line no-undef
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    // eslint-disable-next-line no-undef
    self.skipWaiting();
  }
});

// Fetch event - use network-first for HTML, cache-first for assets
// eslint-disable-next-line no-undef
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  // eslint-disable-next-line no-undef
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // eslint-disable-next-line no-undef
  const url = new URL(event.request.url);
  const isHTML =
    event.request.headers.get('accept')?.includes('text/html') ||
    url.pathname.endsWith('.html') ||
    url.pathname === `${BASE_PATH}/` ||
    url.pathname === `${BASE_PATH}`;

  if (isHTML) {
    // Network-first strategy for HTML files to always get fresh content
    event.respondWith(
      // eslint-disable-next-line no-undef
      fetch(event.request)
        .then(response => {
          // Check if valid response
          if (response && response.status === 200) {
            // Clone and cache the response
            const responseToCache = response.clone();
            // eslint-disable-next-line no-undef
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          // eslint-disable-next-line no-undef
          return caches.match(event.request).then(response => {
            // eslint-disable-next-line no-undef
            return response || caches.match(`${BASE_PATH}/index.html`);
          });
        })
    );
  } else {
    // Cache-first strategy for assets (CSS, JS, images, fonts)
    event.respondWith(
      // eslint-disable-next-line no-undef
      caches.match(event.request).then(response => {
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        // eslint-disable-next-line no-undef
        return fetch(fetchRequest)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the fetched resource
            // eslint-disable-next-line no-undef
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            // Return offline page if available
            // eslint-disable-next-line no-undef
            return caches.match(`${BASE_PATH}/index.html`);
          });
      })
    );
  }
});
