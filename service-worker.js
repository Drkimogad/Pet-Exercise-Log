const CACHE_NAME = 'Pet-Exercise-Log-cache-v6'; // Update cache version
const urlsToCache = [
    '/Pet-Exercise-Log/',                // Main page URL
    '/Pet-Exercise-Log/index.html',      // Ensure main HTML page is cached
    '/Pet-Exercise-Log/styles.css',
    '/Pet-Exercise-Log/js/auth.js',
    '/Pet-Exercise-Log/js/petEntry.js',
    '/Pet-Exercise-Log/js/calender.js',
    '/Pet-Exercise-Log/js/moodLogs.js',
    '/Pet-Exercise-Log/js/charts.js',
    '/Pet-Exercise-Log/js/savedProfiles.js',
    '/Pet-Exercise-Log/js/monthlyReport.js',
    '/Pet-Exercise-Log/js/dataService.js',
    '/Pet-Exercise-Log/manifest.json',
    '/Pet-Exercise-Log/icons/icon-192x192.png', // Updated path for icons
    '/Pet-Exercise-Log/favicon.ico',
    '/Pet-Exercise-Log/public/images/default-pet.png', // Updated path for images
    'https://cdn.jsdelivr.net/npm/chart.js',
    '/Pet-Exercise-Log/offline.html'     // Ensure offline page is cached
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
                    urlsToCache.forEach(url => {
                        fetch(url).then(response => {
                            if (!response.ok) {
                                console.error('Failed to fetch:', url);
                            }
                        });
                    });
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

            // If the request is for an HTML file (navigation), return the index.html 
            if (event.request.mode === 'navigate') {
                return caches.match('/Pet-Exercise-Log/index.html').then(response => {
                    if (response) {
                        return response;
                    } else {
                        return fetch(event.request);
                    }
                });
            }

            console.log('Fetching from network:', event.request.url);
            return fetch(event.request).catch(() => {
                // Offline fallback if fetch fails (e.g., user is offline)
                return caches.match('/Pet-Exercise-Log/offline.html');  // Ensure offline.html is cached
            });
        }).catch((err) => {
            console.error('Error fetching:', err);
            // In case of any unexpected errors, fallback to index.html
            return caches.match('/Pet-Exercise-Log/index.html');
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
