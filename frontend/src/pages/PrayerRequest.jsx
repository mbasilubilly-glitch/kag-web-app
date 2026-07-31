import { useState } from 'react'
import api from '../api'
import { enqueuePost, retryQueuedPosts } from '../utils/offlineQueue'

export default function PrayerRequest() {
  const [form, setForm] = useState({ request: '' })
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    const payload = { request: form.request }

    try {
      // Try online first.
      await api.post('/prayer-requests/', payload)
      setMessage('Prayer request submitted successfully. Thank you!')
      setForm({ request: '' })

      // Best-effort: retry any queued posts.
      if (navigator.onLine) {
        try {
          await retryQueuedPosts()
        } catch (_) {}
      }
    } catch (err) {
      // Offline / failed: queue for background sync if supported.
      const isOffline = !navigator.onLine
      try {
        await enqueuePost({ url: `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'}/prayer-requests/`, body: payload })

        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          const reg = await navigator.serviceWorker.ready
          await reg.sync.register('kag-prayer-requests')
          setMessage(isOffline ? 'You are offline. Saved your prayer request and will submit automatically when online.' : 'Saved your prayer request for retry.')
        } else {
          setMessage('Saved your prayer request for retry when you are back online.')
        }
      } catch (queueErr) {
        setMessage('Unable to submit your prayer request. Please try again later.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold mb-3">Prayer Request</h1>
        <p className="text-slate-600 mb-6">Submit your prayer request. We will be praying for you.</p>

        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="text-slate-700">Your Request</span>
            <textarea
              name="request"
              value={form.request}
              onChange={handleChange}
              required
              rows={6}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>

          {message && <div className="rounded-2xl bg-slate-100 p-4 text-slate-800">{message}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Prayer Request'}
          </button>
        </form>
      </div>
    </div>
  )
}

