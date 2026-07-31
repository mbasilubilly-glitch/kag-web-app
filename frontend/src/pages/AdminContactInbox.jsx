import { useEffect, useMemo, useState } from 'react'
import api from '../api'

function formatWhen(ts) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ''
  }
}

export default function AdminContactInbox() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [replyDrafts, setReplyDrafts] = useState({})
  const [savingId, setSavingId] = useState(null)

  const unreadCount = useMemo(() => {
    // “Unread” = no reply yet.
    return items.filter((i) => !i.reply_text).length
  }, [items])

  const fetchInbox = async () => {
    setError('')
    setLoading(true)

    try {
      const res = await api.get('/contact-messages/')
      const data = res.data || []
      setItems(data)

      // Initialize drafts with existing replies.
      const initial = {}
      for (const item of data) {
        initial[item.id] = item.reply_text || ''
      }
      setReplyDrafts(initial)
    } catch {
      setError('Unable to load contact messages.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInbox()
  }, [])

  const handleChange = (id, value) => {
    setReplyDrafts((prev) => ({ ...prev, [id]: value }))
  }

  const handleSaveReply = async (id) => {
    setSavingId(id)
    setError('')

    try {
      const reply_text = (replyDrafts[id] || '').trim()
      if (!reply_text) {
        setError('Reply cannot be empty.')
        return
      }

      await api.patch(`/contact-messages/${id}/`, { reply_text })
      await fetchInbox()
    } catch {
      setError('Unable to save reply.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Contact Inbox</h1>
          <p className="text-slate-600 text-sm mt-1">Messages from the Contact Us form. Reply and track responses here.</p>
        </div>
        <div className="rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-semibold">
          {loading ? '...' : `${unreadCount} pending`}
        </div>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}

      {loading ? (
        <div className="rounded-3xl bg-slate-100 p-10 text-center text-slate-600">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-slate-100 p-10 text-center text-slate-600">No contact messages yet.</div>
      ) : (
        <div className="grid gap-4">
          {items.map((m) => (
            <div key={m.id} className="rounded-2xl bg-white p-5 border shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-semibold text-slate-900">{m.subject}</div>
                  <div className="text-sm text-slate-600 mt-1">
                    From: {m.full_name} {m.email ? `(${m.email})` : ''}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{formatWhen(m.created_at)}</div>
                </div>
                {!m.reply_text ? (
                  <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                    Pending
                  </div>
                ) : (
                  <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    Replied
                  </div>
                )}
              </div>

              <div className="text-slate-800 whitespace-pre-wrap">{m.message}</div>

              <div className="rounded-xl bg-slate-50 border p-4">
                <div className="font-semibold text-slate-900 mb-2">Admin Reply</div>
                <textarea
                  value={replyDrafts[m.id] ?? ''}
                  onChange={(e) => handleChange(m.id, e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border px-4 py-3"
                  placeholder="Write your reply to the sender..."
                />

                <div className="mt-3 flex gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleSaveReply(m.id)}
                    disabled={savingId === m.id}
                    className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60"
                  >
                    {savingId === m.id ? 'Saving…' : 'Save Reply'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReplyDrafts((prev) => ({ ...prev, [m.id]: m.reply_text || '' }))
                    }}
                    className="rounded-2xl border border-slate-900 px-6 py-3 font-semibold text-slate-900"
                  >
                    Reset
                  </button>
                </div>

                {m.reply_text ? (
                  <div className="text-xs text-slate-500 mt-2">
                    Last replied: {formatWhen(m.replied_at)}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

