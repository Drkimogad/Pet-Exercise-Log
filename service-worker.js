const CACHE_NAME = 'Pet-Exercise-Log-cache-v11';
const OFFLINE_PAGE = '/offline.html';

// Environment configuration - CHANGE THIS WHEN DEPLOYING
const ENV_CONFIG = {
    // For GitHub Pages development
    GITHUB: {
        root: '/Pet-Exercise-Log/',
        paths: {
            js: '/Pet-Exercise-Log/js/',
            images: '/Pet-Exercise-Log/images/',
            icons: '/Pet-Exercise-Log/icons/',
            banner: '/Pet-Exercise-Log/banner/'
        }
    },
    // For Firebase Hosting production
    FIREBASE: {
        root: '/',
        paths: {
            js: '/js/',
            images: '/images/',
            icons: '/icons/',
            banner: '/banner/'
        }
    }
};

// Select environment - CHANGE THIS LINE WHEN DEPLOYING
const CURRENT_ENV = ENV_CONFIG.GITHUB; // Change to FIREBASE for production
// const CURRENT_ENV = ENV_CONFIG.FIREBASE;

// Generate URLs to cache based on environment
function getUrlsToCache() {
    const p = CURRENT_ENV.paths;
    
    return [
        // HTML Pages - USE EXACT PATHS
        CURRENT_ENV.root + 'index.html',
        CURRENT_ENV.root + 'offline.html',
        CURRENT_ENV.root + 'terms.html', 
        CURRENT_ENV.root + 'privacy.html',
        
        // Core JavaScript Files
        CURRENT_ENV.root + 'auth.js',
        CURRENT_ENV.root + 'dashboard.js',
        CURRENT_ENV.root + 'utils.js',
        
        // Styles and Manifest
        CURRENT_ENV.root + 'styles.css',
        CURRENT_ENV.root + 'manifest.json',
        CURRENT_ENV.root + 'favicon.ico',
        
        // Images and Icons - USE RELATIVE PATHS
        'images/default-pet.png',
        'banner/treadmillingpets.png', 
        'icons/icon-192x192.png',
        'icons/icon-512x512.png',
        
        // External Dependencies
        'https://cdn.jsdelivr.net/npm/chart.js'
    ].map(url => url.startsWith('http') ? url : CURRENT_ENV.root + url);
}

const urlsToCache = getUrlsToCache();

// Helper function to get correct path for current environment
function getPath(url) {
    if (url.startsWith('http')) return url;
    return CURRENT_ENV.root + url.replace(/^\//, '');
}

// Install event: Cache essential assets
self.addEventListener('install', (event) => {
    console.log('🚀 Service Worker installing for environment:', CURRENT_ENV.root);
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('📦 Caching assets...');
            return cache.addAll(urlsToCache.map(getPath))
                .then(() => {
                    console.log('✅ All assets cached successfully!');
                    // Log cached URLs for debugging
                    return cache.keys().then(requests => {
                        console.log('📋 Cached URLs:', requests.map(req => req.url));
                    });
                })
                .catch((error) => {
                    console.error('❌ Cache installation failed:', error);
                    // Cache critical assets individually if batch fails
                    const criticalAssets = [
                        getPath('offline.html'),
                        getPath('index.html'),
                        getPath('styles.css'),
                        getPath('auth.js')
                    ];
                    return Promise.all(
                        criticalAssets.map(url => 
                            cache.add(url).catch(e => 
                                console.warn('⚠️ Failed to cache:', url, e)
                            )
                        )
                    );
                });
        })
    );
});

// Fetch event: Smart caching strategy
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests and browser extensions
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }

    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            // For navigation requests, serve from cache with network fallback
            if (request.mode === 'navigate') {
                if (cachedResponse) {
                    console.log('🏠 Serving navigation from cache:', url.pathname);
                    return cachedResponse;
                }
                
                // If not in cache, fetch from network
                return fetch(request).catch(() => {
                    console.log('📵 Offline - serving offline page');
                    return caches.match(getPath('offline.html'));
                });
            }

            // For static assets, use Cache First strategy
            if (isStaticAsset(url)) {
                if (cachedResponse) {
                    console.log('📁 Serving static asset from cache:', url.pathname);
                    return cachedResponse;
                }
                
                return fetch(request).then(networkResponse => {
                    // Cache the new resource
                    if (networkResponse.ok) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, responseClone);
                        });
                    }
                    return networkResponse;
                }).catch(error => {
                    console.warn('⚠️ Network failed for static asset:', url.pathname, error);
                    // Even if not cached, let the error propagate for better error handling
                    throw error;
                });
            }

            // For API/data requests, use Network First strategy
            return fetch(request).then(networkResponse => {
                // Cache successful API responses (optional - for future offline functionality)
                if (networkResponse.ok && isCacheableApiRequest(url)) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(error => {
                // For API requests, return cached version if available
                if (cachedResponse) {
                    console.log('🔴 Offline - serving cached API response:', url.pathname);
                    return cachedResponse;
                }
                throw error;
            });

        }).catch(error => {
            console.error('💥 Fetch handler error:', error);
            // Ultimate fallback - serve offline page for HTML requests
            if (request.mode === 'navigate') {
                return caches.match(getPath('offline.html'));
            }
            throw error;
        })
    );
});

// Helper functions
function isStaticAsset(url) {
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
    return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

function isCacheableApiRequest(url) {
    // Define which API endpoints can be cached for offline use
    const cacheableApis = ['/api/pets', '/api/exercises', '/api/mood'];
    return cacheableApis.some(api => url.pathname.includes(api));
}

// Activate event: Clean up and take control
self.addEventListener('activate', (event) => {
    console.log('🔄 Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker activated and ready!');
            return self.clients.claim();
        })
    );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
    console.log('📨 Message received in SW:', event.data);
    
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
    
    if (event.data.action === 'getCacheStatus') {
        caches.open(CACHE_NAME).then(cache => {
            cache.keys().then(requests => {
                event.ports[0].postMessage({
                    cacheSize: requests.length,
                    cachedUrls: requests.map(req => req.url)
                });
            });
        });
    }
});

// Background sync for future offline functionality
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('🔄 Background sync triggered');
        // Future: Handle offline data sync here
    }
});
