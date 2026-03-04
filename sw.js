/**
 * Service Worker with Workbox
 * Precaches static assets and implements runtime caching strategies
 */

importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js')

if (workbox) {
  console.log('Workbox loaded successfully')

  // Use StaleWhileRevalidate for precached static assets
  workbox.routing.registerRoute(
    ({request}) => ['document', 'stylesheet', 'script'].includes(request.destination),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-v1',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxAgeSeconds: 86400 * 30 // 30 days
        })
      ]
    })
  )

  // API calls: Network-first with timeout and fallback
  workbox.routing.registerRoute(
    ({url}) => url.pathname.startsWith('/api/'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-cache-v1',
      networkTimeoutSeconds: 5,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 1800
        })
      ]
    })
  )

  // Image caching (if any)
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images-v1',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 604800 // 7 days
        })
      ]
    })
  )

  // Clean old caches on activation
  workbox.core.clientsClaim()
  workbox.core.skipWaiting()

  // Background sync for cache revalidation (best-effort)
  self.addEventListener('sync', event => {
    if (event.tag === 'refresh-weather'){
      event.waitUntil(
        caches.open('api-cache-v1').then(cache =>
          cache.keys().then(keys => Promise.all(
            keys.map(req => fetch(req).then(res => {
              if (res && res.ok) return cache.put(req, res.clone())
            }).catch(()=>{}))
          ))
        ).catch(()=>{})
      )
    }
  })

  // Handle messages from client
  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING'){
      self.skipWaiting()
    }
  })

} else {
  console.warn('Workbox not available')
}
