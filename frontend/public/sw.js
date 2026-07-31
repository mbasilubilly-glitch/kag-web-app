const APP_SHELL_CACHE = 'kag-unity-app-shell-v2'
const RUNTIME_PAGES_CACHE = 'kag-unity-pages-v2'
const RUNTIME_ASSETS_CACHE = 'kag-unity-assets-v2'
const RUNTIME_MEDIA_CACHE = 'kag-unity-media-v2'

const OFFLINE_URL = '/offline.html'

// Minimal precache list (app shell). Do not precache JS modules aggressively.
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  OFFLINE_URL,
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (![APP_SHELL_CACHE, RUNTIME_PAGES_CACHE, RUNTIME_ASSETS_CACHE, RUNTIME_MEDIA_CACHE].includes(key)) {
            return caches.delete(key)
          }
          return null
        })
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('message', (event) => {
  if (!event.data || !event.data.type) return

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
    return
  }

  // Cache media URLs for offline use.
  if (event.data.type === 'CACHE_URLS' && Array.isArray(event.data.urls)) {
    const urls = event.data.urls.filter(Boolean)
    if (!urls.length) return

    event.waitUntil(
      caches.open(RUNTIME_MEDIA_CACHE).then(async (cache) => {
        // Use 'no-cors' to allow caching cross-origin assets (may be opaque).
        // The offline playback will still work for same-origin; cross-origin depends on server CORS.
        await Promise.all(
          urls.map(async (url) => {
            try {
              const req = new Request(url, { mode: 'no-cors' })
              const match = await cache.match(req)
              if (match) return

              const res = await fetch(url, { mode: 'no-cors', cache: 'no-store' })
              if (res && res.ok) {
                await cachePutWithLimit(cache, req, res.clone(), 120)
              }
            } catch (_) {
              // best effort: ignore individual failures
            }
          })
        )
      })
    )
  }
})



function isNavigationRequest(request) {
  return request.mode === 'navigate' || (request.destination === '' && request.headers.get('accept')?.includes('text/html'))
}

async function cachePutWithLimit(cache, request, response, maxEntries = 60) {
  await cache.put(request, response)

  const keys = await cache.keys()
  if (keys.length > maxEntries) {
    // delete oldest
    await cache.delete(keys[0])
  }
}

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch (_) {
    payload = {}
  }

  const title = payload.title || 'KAG Unity Church'
  const options = {
    body: payload.body || payload.message || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: {
      url: payload.url || '/notifications',
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event?.notification?.data?.url || '/notifications'

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true })
      if (allClients && allClients.length) {
        const client = allClients.find((c) => c.url && c.url.includes(targetUrl)) || allClients[0]
        client.focus()
        // If already open, best effort navigate
        try {
          client.navigate(targetUrl)
        } catch (_) {}
        return
      }

      await clients.openWindow(targetUrl)
    })()
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const requestUrl = new URL(event.request.url)
  const isSameOrigin = requestUrl.origin === self.location.origin

  // API: do not mask failures with fabricated JSON.
  // Let the page/client handle network/auth errors normally.
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request))
    return
  }





  // Navigation: prefer network when online, otherwise fall back to cached/offline.
  // This prevents false offline screens when the user is actually connected.
  if (isNavigationRequest(event.request)) {
    const shouldTryNetwork = self.navigator?.onLine !== false


    if (shouldTryNetwork) {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            const copy = response.clone()
            caches.open(RUNTIME_PAGES_CACHE).then((cache) => cache.put(event.request, copy))
            return response
          })
          .catch(async () => {
            const cached = await caches.match(event.request)
            return cached || (await caches.match(OFFLINE_URL))
          })

      )
    } else {
      event.respondWith(
        caches.match(event.request).then((cached) => {
          return cached || caches.match(OFFLINE_URL)
        })
      )
    }
    return
  }


  // Only apply caching to same-origin assets/media. API is handled separately.
  if (!isSameOrigin) {
    event.respondWith(fetch(event.request))
    return
  }

  // Media: cache-first for previously fetched sermon/media assets
  const mediaExtPattern = /\.(mp3|mp4|webm|ogg|wav|pdf|jpg|jpeg|png|webp)$/i
  const looksLikeMedia = mediaExtPattern.test(requestUrl.pathname)

  if (looksLikeMedia) {
    event.respondWith(
      caches.open(RUNTIME_MEDIA_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request)
        if (cached) return cached

        const response = await fetch(event.request)
        if (response && response.ok) {
          await cachePutWithLimit(cache, event.request, response.clone(), 80)
        }
        return response
      })
    )
    return
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.open(RUNTIME_ASSETS_CACHE).then(async (cache) => {
      const cached = await cache.match(event.request)
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            cache.put(event.request, response.clone())
          }
          return response
        })
        .catch(() => null)

      // Return cache immediately if present; otherwise await network.
      if (cached) return cached
      const network = await fetchPromise
      return network || (await caches.match(OFFLINE_URL))
    })
  )
})

// Background Sync: retry queued POSTs when the browser decides we're online again.
// This requires browser support for SyncManager.
self.addEventListener('sync', (event) => {
  if (!event.tag) return

  // Keep tag filtering for performance, but retry ALL queued items regardless of which tag triggered.
  if (!['kag-prayer-requests', 'kag-event-registrations'].includes(event.tag)) return

  event.waitUntil(
    (async () => {
      // Minimal queue retry in SW scope (classic service worker cannot import ES modules reliably).
      const DB_NAME = 'kag-unity-offline-queue'
      const STORE_NAME = 'requests'
      const DB_VERSION = 1

      function openDB() {
        return new Promise((resolve, reject) => {
          const req = indexedDB.open(DB_NAME, DB_VERSION)
          req.onupgradeneeded = () => {
            const db = req.result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
            }
          }
          req.onsuccess = () => resolve(req.result)
          req.onerror = () => reject(req.error)
        })
      }

      const db = await openDB()

      const queued = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const reqGetAll = store.getAll()
        reqGetAll.onsuccess = () => resolve(reqGetAll.result || [])
        reqGetAll.onerror = () => reject(reqGetAll.error)
      })

      for (const item of queued) {
        try {
          if (!item || !item.url) {
            continue
          }

          const token = (() => {
            try {
              return self.localStorage?.getItem('authToken')
            } catch (_) {
              return null
            }
          })()

          const res = await fetch(item.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              ...(item.headers || {}),
            },
            body: JSON.stringify(item.body || {}),
          })


          if (res && res.ok) {
            await new Promise((resolve, reject) => {
              const delTx = db.transaction(STORE_NAME, 'readwrite')
              const delStore = delTx.objectStore(STORE_NAME)
              const del = delStore.delete(item.id)
              del.onsuccess = () => resolve()
              del.onerror = () => reject(del.error)
            })
          }
        } catch (e) {
          // keep item for next sync
        }
      }
    })()
  )
})





