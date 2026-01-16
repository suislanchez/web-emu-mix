// PixelVault Service Worker v2
const CACHE_VERSION = 'v2'
const STATIC_CACHE = `pixelvault-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `pixelvault-dynamic-${CACHE_VERSION}`
const CORE_CACHE = `pixelvault-cores-${CACHE_VERSION}`
const IMAGE_CACHE = `pixelvault-images-${CACHE_VERSION}`

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/gamepad.svg',
  '/manifest.json',
]

// Max items in dynamic cache
const MAX_DYNAMIC_ITEMS = 100
const MAX_IMAGE_ITEMS = 200

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, CORE_CACHE, IMAGE_CACHE]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('pixelvault-') && !currentCaches.includes(name))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return

  // Handle EmulatorJS cores - cache first, long-term storage
  if (url.hostname === 'cdn.emulatorjs.org') {
    event.respondWith(
      caches.open(CORE_CACHE).then((cache) => {
        return cache.match(event.request).then((cached) => {
          if (cached) {
            console.log('[SW] Serving core from cache:', url.pathname)
            return cached
          }

          return fetch(event.request).then((response) => {
            if (response.ok) {
              console.log('[SW] Caching core:', url.pathname)
              cache.put(event.request, response.clone())
            }
            return response
          })
        })
      })
    )
    return
  }

  // Handle cover art images - cache with limit
  if (url.hostname.includes('libretro') || url.hostname.includes('thumbnails') ||
      url.pathname.includes('cover') || url.pathname.includes('boxart')) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(event.request).then((cached) => {
          if (cached) return cached

          return fetch(event.request).then((response) => {
            if (response.ok) {
              // Limit cache size
              limitCacheSize(IMAGE_CACHE, MAX_IMAGE_ITEMS)
              cache.put(event.request, response.clone())
            }
            return response
          }).catch(() => {
            // Return placeholder on failure
            return new Response('', { status: 404 })
          })
        })
      })
    )
    return
  }

  // Static assets - cache first
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request)
      })
    )
    return
  }

  // Network-first for API requests
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Stale-while-revalidate for everything else
  event.respondWith(
    caches.open(DYNAMIC_CACHE).then((cache) => {
      return cache.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok) {
            limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_ITEMS)
            cache.put(event.request, response.clone())
          }
          return response
        }).catch(() => cached)

        return cached || fetchPromise
      })
    })
  )
})

// Limit cache size
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length > maxItems) {
    // Delete oldest items
    const toDelete = keys.slice(0, keys.length - maxItems)
    await Promise.all(toDelete.map(key => cache.delete(key)))
  }
}

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting()
  }

  if (event.data === 'clearCache') {
    caches.keys().then((names) => {
      return Promise.all(names.map(name => caches.delete(name)))
    }).then(() => {
      event.ports[0]?.postMessage({ cleared: true })
    })
  }

  if (event.data === 'getCacheStats') {
    Promise.all([
      caches.open(CORE_CACHE).then(c => c.keys()).then(k => k.length),
      caches.open(IMAGE_CACHE).then(c => c.keys()).then(k => k.length),
      caches.open(DYNAMIC_CACHE).then(c => c.keys()).then(k => k.length),
    ]).then(([cores, images, dynamic]) => {
      event.ports[0]?.postMessage({ cores, images, dynamic })
    })
  }
})
