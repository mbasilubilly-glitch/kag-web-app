import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'
import { enqueuePost, retryQueuedPosts } from '../utils/offlineQueue'

export default function EventRegistration() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [form, setForm] = useState({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get(`/events/${id}/`).then((res) => setEvent(res.data)).catch(() => {})
  }, [id])

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    const payload = {
      event: Number(id),
      full_name: form.full_name || '',
      phone: form.phone || '',
    }

    try {
      await api.post('/event-registrations/', payload)
      setMessage('Registration submitted successfully. Thank you!')

      if (navigator.onLine) {
        try {
          await retryQueuedPosts()
        } catch (_) {}
      }
    } catch (err) {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
      const queueUrl = `${base}/event-registrations/`
      try {
        await enqueuePost({ url: queueUrl, body: payload })

        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          const reg = await navigator.serviceWorker.ready
          await reg.sync.register('kag-event-registrations')
          setMessage('You are offline. Saved your event registration and will retry when online.')
        } else {
          setMessage('Saved your event registration for retry when you are back online.')
        }
      } catch (_) {
        setMessage('Unable to submit your registration. Please try again later.')
      }
    } finally {
      setSubmitting(false)
    }

  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-3">Event Registration</h1>
          {event ? (
            <>
              <p className="text-slate-600">{event.title}</p>
              <p className="text-slate-600">{new Date(event.date).toLocaleString()}</p>
              <p className="text-slate-600">Venue: {event.venue}</p>
            </>
          ) : (
            <p className="text-slate-600">Loading event...</p>
          )}
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="rounded-2xl bg-slate-100 p-4 text-slate-700">
            Register your details below. If you go offline, your registration will be queued for retry.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-slate-700">Full Name</span>
              <input
                type="text"
                value={form.full_name || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                required
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-slate-700">Phone</span>
              <input
                type="tel"
                value={form.phone || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                required
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
          </div>

          {message && <div className="rounded-2xl bg-slate-100 p-4 text-slate-800">{message}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Register for Event'}
          </button>
        </form>
      </div>
    </div>
  )
}

