const CACHE_NAME = 'Pet-Exercise-Log-cache-v2'; // Update cache version
const OFFLINE_URL = 'https://drkimogad.github.io/Pet-Exercise-Log/offline.html';
const urlsToCache = [
    'https://drkimogad.github.io/Pet-Exercise-Log/',                // Main page URL
    'https://drkimogad.github.io/Pet-Exercise-Log/index.html',      // Ensure main HTML page is cached
    'https://drkimogad.github.io/Pet-Exercise-Log/style.css',
    'https://drkimogad.github.io/Pet-Exercise-Log/app.js',
    'https://drkimogad.github.io/Pet-Exercise-Log/manifest.json',
    'https://drkimogad.github.io/Pet-Exercise-Log/icons/icon-192x192.png',
    'https://drkimogad.github.io/Pet-Exercise-Log/favicon.ico',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://drkimogad.github.io/Pet-Exercise-Log/offline.html'     // Ensure offline page is cached
];

// Install event: Cache necessary assets
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Forces the new service worker to take control immediately

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching assets during install');
            return cache.addAll(urlsToCache)
                .then(() => {
                    console.log('Assets successfully cached!');
                    // Debugging: List cached URLs
                    cache.keys().then((requestUrls) => {
                        requestUrls.forEach((url) => {
                            console.log('Cached URL:', url);
                        });
                    });
                })
                .catch((err) => {
                    console.error('Error caching assets:', err);
                });
        })
    );
});

// Fetch event: Serve assets from cache or fetch from network if not cached
self.addEventListener('fetch', (event) => {
    console.log('Fetching request for:', event.request.url);

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                console.log('Serving from cache:', event.request.url);
                return cachedResponse; // Serve from cache
            }

            // If the request is for an HTML file (navigation), return the offline page
            if (event.request.mode === 'navigate') {
                return fetch(event.request).catch(() => 
                    caches.match(OFFLINE_URL)
                );
            }

            console.log('Fetching from network:', event.request.url);
            return fetch(event.request).catch(() => {
                // Offline fallback if fetch fails (e.g., user is offline)
                return caches.match(OFFLINE_URL);
            });
        }).catch((err) => {
            console.error('Error fetching:', err);
            // In case of any unexpected errors, fallback to offline.html
            return caches.match(OFFLINE_URL);
        })
    );
});

// Activate event: Clean up old caches and take control immediately
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];  // Only keep the current cache

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName); // Delete old caches
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker activated and ready');
            self.clients.claim();  // Claim clients immediately after activation
        })
    );
});

// NEW: Check for updates and fetch new service worker
self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting(); // Skip waiting and immediately activate the new service worker
    }
});
