// Service Worker for offline POS functionality
const CACHE_NAME = 'pos-v1'
const OFFLINE_CACHE = 'pos-offline-v1'
const DYNAMIC_CACHE = 'pos-dynamic-v1'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/pos',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets')
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('[Service Worker] Failed to cache:', err)
      })
    })
  )

  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name !== CACHE_NAME &&
                   name !== OFFLINE_CACHE &&
                   name !== DYNAMIC_CACHE
          })
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )

  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip Chrome extensions
  if (request.url.startsWith('chrome-extension://')) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse
      }

      // Otherwise, fetch from network
      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response
          }

          // Cache API responses and images
          if (
            request.url.includes('/api/') ||
            request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)
          ) {
            const responseClone = response.clone()

            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }

          return response
        })
        .catch((err) => {
          console.error('[Service Worker] Fetch failed:', err)

          // Return offline page for navigation requests
          if (request.destination === 'document') {
            return caches.match('/offline')
          }

          // Return placeholder for images
          if (request.destination === 'image') {
            return caches.match('/images/placeholder.png')
          }

          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          })
        })
    })
  )
})

// Background sync for offline orders
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag)

  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders())
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event)

  const data = event.data ? event.data.json() : {}
  const title = data.title || 'POS Notification'
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'pos-notification',
    data: data.url || '/',
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event)

  event.notification.close()

  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  )
})

// Helper function to sync offline orders
async function syncOrders() {
  try {
    // Get pending orders from IndexedDB
    const db = await openDatabase()
    const pendingOrders = await getPendingOrders(db)

    for (const order of pendingOrders) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order),
        })

        if (response.ok) {
          // Remove from IndexedDB on success
          await removePendingOrder(db, order.id)
          console.log('[Service Worker] Order synced:', order.id)
        }
      } catch (err) {
        console.error('[Service Worker] Failed to sync order:', err)
      }
    }
  } catch (err) {
    console.error('[Service Worker] Sync failed:', err)
  }
}

// IndexedDB helpers
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('POSOfflineDB', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      if (!db.objectStoreNames.contains('pendingOrders')) {
        db.createObjectStore('pendingOrders', { keyPath: 'id' })
      }
    }
  })
}

function getPendingOrders(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingOrders'], 'readonly')
    const store = transaction.objectStore('pendingOrders')
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

function removePendingOrder(db, orderId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingOrders'], 'readwrite')
    const store = transaction.objectStore('pendingOrders')
    const request = store.delete(orderId)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}
