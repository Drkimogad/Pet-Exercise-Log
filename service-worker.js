const CACHE_NAME = 'Pet-Exercise-Log-cache-v1'; // Update cache version
const urlsToCache = [
    'https://drkimogad.github.io/Pet-Exercise-Log/',
    'https://drkimogad.github.io/Pet-Exercise-Log/index.html',
    'https://drkimogad.github.io/Pet-Exercise-Log/style.css',
    'https://drkimogad.github.io/Pet-Exercise-Log/app.js',
    'https://drkimogad.github.io/Pet-Exercise-Log/manifest.json',
    'https://drkimogad.github.io/Pet-Exercise-Log/icons/icon-192x192.png',
    'https://drkimogad.github.io/Pet-Exercise-Log/icons/icon-512x512.png',
    'https://drkimogad.github.io/Pet-Exercise-Log/favicon.ico',
    'https://drkimogad.github.io/Pet-Exercise-Log/offline.html'
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
                    urlsToCache.forEach((url) => {
                        fetch(url).then(response => {
                            if (!response.ok) {
                                console.error('Failed to fetch URL:', url, response.status);
                            }
                        }).catch(fetchErr => {
                            console.error('Error fetching URL:', url, fetchErr);
                        });
                    });
                });
        }).catch((err) => {
            console.error('Error opening cache:', err);
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
                return caches.match('/offline.html');  // Ensure offline.html is cached
            }

            console.log('Fetching from network:', event.request.url);
            return fetch(event.request).catch(() => {
                // Offline fallback if fetch fails (e.g., user is offline)
                return caches.match('/offline.html');  // Ensure offline.html is cached
            });
        }).catch((err) => {
            console.error('Error fetching:', err);
            // In case of any unexpected errors, fallback to offline.html
            return caches.match('/offline.html');
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
