module.exports = {
  globDirectory: '.',
  globPatterns: [
    'index.html',
    'styles.css',
    'app.js',
    'icons.js',
    'pkg.json' // fallback
  ],
  globIgnores: [
    'node_modules/**/*',
    'server.js',
    'package.json',
    'workbox-config.js',
    '**/*.map'
  ],
  swDest: 'sw.js',
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
  skipWaiting: true,
  cleanupOutdatedCaches: true,
  
  // Client-side precaching manifest will be injected here
  // Generated manifest will be used in sw.js with precacheAndRoute()
  
  // Runtime caching for API and third-party resources
  runtimeCaching: [
    {
      urlPattern: /^http:\/\/localhost:3000\/api\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 1800 // 30 minutes
        },
        networkTimeoutSeconds: 5
      }
    },
    {
      urlPattern: /^https:\/\/(api\.open-meteo|geocoding-api\.open-meteo|nominatim\.openstreetmap)\..*\/.*$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'upstream-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 900
        }
      }
    }
  ]
}
