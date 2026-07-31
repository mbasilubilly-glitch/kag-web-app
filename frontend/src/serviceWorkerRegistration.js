export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  // The Vite dev server serves unhashed module URLs, so the SW's
  // stale-while-revalidate caching for "static assets" can keep serving an
  // old JS module (e.g. a page that was since deleted) indefinitely, even
  // through a hard refresh. Caching is only meaningful against a hashed
  // production build, so in dev we actively unregister any SW/caches left
  // over from a previous production-mode visit instead of registering one.
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister())
    })
    if ('caches' in window) {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)))
    }
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration.scope)

        // Force activation immediately so users don't keep running an old cached SW.
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }

        // Also reload once controller changes to ensure the new SW handles subsequent requests.
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload()
          })
        }


        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            // waiting = installed and ready to activate
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error)
      })
  })
}

