# Service Worker for Offline Support

This service worker enables offline map caching for the SignalTrail navigation interface.

## Implementation

Add to `frontend/public/sw.js`:

```javascript
const CACHE_NAME = 'signaltrail-v1';
const urlsToCache = [
  '/',
  '/navigate',
  '/offline.html'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          (response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

## Registration

Add to `frontend/app/layout.tsx`:

```typescript
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => console.log('SW registered'))
      .catch((error) => console.log('SW registration failed:', error));
  }
}, []);
```

## Offline Fallback Page

Create `frontend/public/offline.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Offline - SignalTrail</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
  </style>
</head>
<body>
  <h1>You're Offline</h1>
  <p>SignalTrail requires an internet connection.</p>
  <p>Please check your connection and try again.</p>
</body>
</html>
```

## Testing Offline Mode

1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Reload page
4. Previously cached pages should load
5. New requests show offline fallback

## Cache Strategy

- **Cache First**: Navigation pages, static assets
- **Network First**: API calls (with offline detection)
- **Stale While Revalidate**: Map tiles
