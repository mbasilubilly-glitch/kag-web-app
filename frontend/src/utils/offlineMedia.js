// Offline media caching helper.
// Sends a message to the service worker to cache given URLs.

export async function cacheMediaUrls(urls = []) {
  if (!('serviceWorker' in navigator)) return { ok: false, reason: 'No serviceWorker' }
  const reg = await navigator.serviceWorker.ready

  const normalized = urls.filter(Boolean)
  if (!normalized.length) return { ok: true, cached: 0 }

  // Ask SW to cache these URLs into its runtime media cache.
  reg.active?.postMessage({ type: 'CACHE_URLS', urls: normalized })
  if (!reg.active) {
    // Try controller as fallback.
    navigator.serviceWorker.controller?.postMessage({ type: 'CACHE_URLS', urls: normalized })
  }

  return { ok: true, cached: normalized.length }
}

