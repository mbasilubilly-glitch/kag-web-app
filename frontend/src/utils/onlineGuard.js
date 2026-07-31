export function isProbablyOnline() {
  if (typeof navigator === 'undefined') return true
  if (typeof navigator.onLine === 'boolean') return navigator.onLine
  return true
}

export function waitForOnline({ timeoutMs = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    if (isProbablyOnline()) return resolve(true)

    const onOnline = () => {
      cleanup()
      resolve(true)
    }

    const onTimeout = () => {
      cleanup()
      reject(new Error('Timed out waiting for online connectivity'))
    }

    const cleanup = () => {
      window.removeEventListener('online', onOnline)
      clearTimeout(t)
    }

    window.addEventListener('online', onOnline)
    const t = setTimeout(onTimeout, timeoutMs)
  })
}

