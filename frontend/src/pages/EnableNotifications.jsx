import { useState } from 'react'
import api from '../api'
import { subscribeForPush } from '../utils/pushNotifications'

export default function EnableNotifications() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const onEnable = async () => {
    setLoading(true)
    setStatus('')
    try {
      if (!('serviceWorker' in navigator)) {
        setStatus('Service workers not supported in this browser.')
        return
      }

      // Ensure a service worker registration exists.
      const swRegistration = await navigator.serviceWorker.ready

      await subscribeForPush({
        api,
        swRegistration,
        onStatus: setStatus,
      })
    } catch (err) {
      setStatus(err?.message || 'Unable to enable notifications.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10 space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Enable Notifications</h1>
        <p className="text-slate-600 mt-2">
          Get updates about services, sermon uploads, prayer meetings, and announcements.
        </p>
      </div>

      <div className="rounded-3xl bg-slate-900 p-8 text-slate-100 shadow-sm space-y-4">
        <button
          onClick={onEnable}
          disabled={loading}
          className="rounded-2xl bg-white text-slate-900 px-6 py-3 font-semibold disabled:opacity-60"
        >
          {loading ? 'Enabling…' : 'Enable Push Notifications'}
        </button>
        {status && <div className="text-sm text-slate-200">{status}</div>}
        <div className="text-xs text-slate-300">
          If you don’t see permission prompts, check browser notification settings.
        </div>
      </div>
    </div>
  )
}

