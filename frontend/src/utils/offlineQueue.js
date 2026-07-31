// Simple offline queue using IndexedDB (no external libs).
// Stores POST payloads and retries them when the app/SW is online.

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

async function withStore(mode, fn) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode)
    const store = tx.objectStore(STORE_NAME)
    Promise.resolve(fn(store))
      .then((res) => {
        tx.oncomplete = () => resolve(res)
        tx.onerror = () => reject(tx.error)
      })
      .catch(reject)
  })
}

export async function enqueuePost({ url, body, headers = {} }) {
  return withStore('readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const req = store.add({ url, body, headers, createdAt: Date.now() })
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  })
}



export async function getQueuedPosts() {
  return withStore('readonly', (store) => {
    return new Promise((resolve, reject) => {
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error)
    })
  })
}

export async function removeQueuedPostById(id) {
  return withStore('readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const req = store.delete(id)
      req.onsuccess = () => resolve(true)
      req.onerror = () => reject(req.error)
    })
  })
}

export async function clearQueuedPosts() {
  return withStore('readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const req = store.clear()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  })
}


export async function retryQueuedPosts({ fetchImpl = fetch } = {}) {
  const queued = await getQueuedPosts()
  const results = []

  // Re-use auth token if present so queued POSTs behave like axios.
  // Token may live in localStorage or sessionStorage depending on whether
  // the user chose "Remember Me" at sign-in.
  const token = typeof localStorage !== 'undefined'
    ? (localStorage.getItem('authToken') || sessionStorage.getItem('authToken'))
    : null
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

  for (const item of queued) {
    try {
      if (!item || !item.id || !item.url) {
        // Invalid item, skip it
        if (item?.id) {
          await removeQueuedPostById(item.id)
        }
        continue
      }

      const res = await fetchImpl(item.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader || {}),
          ...(item.headers || {}),
        },
        body: JSON.stringify(item.body),
      })

      // Keep only successful posts.
      if (res && res.ok) {
        await removeQueuedPostById(item.id)
        results.push({ id: item.id, ok: true, status: res.status })
      } else {
        // Non-ok response; keep queued for retry
        results.push({ id: item.id, ok: false, status: res?.status || 0 })
      }
    } catch (e) {
      // Network error; keep queued for later retry
      results.push({ id: item.id, ok: false, error: e?.message })
    }
  }

  return results
}


