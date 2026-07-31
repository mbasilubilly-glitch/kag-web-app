import { useEffect, useState } from 'react'
import api from '../api'
import { extractErrorMessage } from '../utils/errors'

function readableError(err, fallback) {
  return extractErrorMessage(err, fallback)
}

export default function AdminNotifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [alsoPush, setAlsoPush] = useState(true)
  const [sending, setSending] = useState(false)

  const load = () => {
    setLoading(true)
    setError('')
    api.get('/notifications/')
      .then((res) => setItems(res.data || []))
      .catch(() => setError('Unable to load notifications'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleSend = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setSending(true)
    try {
      await api.post('/notifications/', { title, message })

      let pushNotice = ''
      if (alsoPush) {
        try {
          const pushRes = await api.post('/push/send/', { title, body: message })
          pushNotice = ' ' + (pushRes.data?.detail || 'Push sent.')
        } catch (pushErr) {
          pushNotice = ' Push broadcast failed: ' + readableError(pushErr, 'unknown error')
        }
      }

      setTitle('')
      setMessage('')
      setNotice('Notification posted.' + pushNotice)
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to send this notification.'))
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this notification?')) return
    setError('')
    try {
      await api.delete(`/notifications/${id}/`)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch {
      setError('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-slate-600 mt-2 text-sm">
          Send a message to every signed-in member - it appears on their Notifications page, and optionally as a
          real push notification to anyone who's enabled push on their device.
        </p>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-800 rounded-2xl">{error}</div>}
      {notice && <div className="p-4 bg-green-100 text-green-800 rounded-2xl">{notice}</div>}

      <form onSubmit={handleSend} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 space-y-4">
        <h2 className="font-semibold text-lg">Send a Notification</h2>
        <label className="block">
          <span className="text-slate-700 text-sm">Title</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Service time change this Sunday"
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
          />
        </label>
        <label className="block">
          <span className="text-slate-700 text-sm">Message</span>
          <textarea
            required
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={alsoPush} onChange={(e) => setAlsoPush(e.target.checked)} className="w-4 h-4" />
          Also send as a push notification to subscribed devices
        </label>
        <button disabled={sending} type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60">
          {sending ? 'Sending…' : 'Send Notification'}
        </button>
      </form>

      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        <h2 className="font-semibold text-lg mb-4">Sent Notifications</h2>
        {loading ? (
          <div className="text-slate-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-slate-500 text-sm">No notifications yet.</div>
        ) : (
          <div className="grid gap-3">
            {items.map((n) => (
              <div key={n.id} className="rounded-2xl bg-slate-50 p-4 flex justify-between items-start gap-4 border border-slate-100">
                <div>
                  <div className="font-semibold text-slate-900">{n.title}</div>
                  <div className="text-sm text-slate-600 mt-1">{n.message}</div>
                  {n.created_at && (
                    <div className="text-xs text-slate-400 mt-2">{new Date(n.created_at).toLocaleString()}</div>
                  )}
                </div>
                <button onClick={() => handleDelete(n.id)} className="text-red-600 text-sm font-semibold shrink-0 hover:text-red-800">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
