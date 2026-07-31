export const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || null

/**
 * Subscribes the browser for Web Push.
 *
 * Expects backend to expose:
 * - POST /api/push-subscriptions/register/
 *   body: { endpoint, keys: { p256dh, auth } }
 */
export async function subscribeForPush({ api, swRegistration, onStatus }) {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers not supported')
  }

  if (!swRegistration) {
    swRegistration = await navigator.serviceWorker.ready
  }

  if (!window.Notification || typeof window.Notification.requestPermission !== 'function') {
    throw new Error('Notifications API not supported')
  }

  const permission = await window.Notification.requestPermission()
  if (permission !== 'granted') {
    onStatus?.('Notification permission not granted')
    return null
  }

  const applicationServerKey = PUBLIC_VAPID_KEY
    ? urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
    : null

  if (!applicationServerKey) {
    throw new Error(
      'Missing VAPID public key. Set VITE_VAPID_PUBLIC_KEY in frontend environment.'
    )
  }

  const subscription = await swRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  })

  // Send subscription to backend.
  const payload = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.toJSON().keys?.p256dh,
      auth: subscription.toJSON().keys?.auth,
    },
  }

  await api.post('/push-subscriptions/register/', payload)

  onStatus?.('Push subscription saved')
  return payload
}

