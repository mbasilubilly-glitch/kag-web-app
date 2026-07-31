import { useEffect, useState } from 'react'
import api from '../api'
import { extractErrorMessage as readableError } from '../utils/errors'

export default function AdminAnnouncements() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [posting, setPosting] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', poster: null })

  const load = () => api.get('/announcements/').then((res) => setItems(res.data.filter((a) => !a.ministry)))

  useEffect(() => {
    load().catch(() => setError('Unable to load announcements.'))
  }, [])

  const postAnnouncement = async (e) => {
    e.preventDefault()
    setError('')
    setPosting(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('body', form.body)
      if (form.poster) fd.append('poster', form.poster)
      await api.post('/announcements/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm({ title: '', body: '', poster: null })
      await load()
    } catch (err) {
      setError(readableError(err, 'Unable to post announcement.'))
    } finally {
      setPosting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return
    try {
      await api.delete(`/announcements/${id}/`)
      setItems(items.filter((i) => i.id !== id))
    } catch {
      setError('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Church-wide Announcements</h1>
        <p className="text-slate-600 mt-1 text-sm">Visible to every member. Department-scoped announcements are posted from within each department's console.</p>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}

      <div className="rounded-3xl bg-white p-6 shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Post an Announcement</h2>
        <form onSubmit={postAnnouncement} className="space-y-3 max-w-xl">
          <input
            type="text" placeholder="Title" required
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Message" required rows={4}
            value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <label className="block">
            <span className="text-slate-700 text-sm">Poster image (optional)</span>
            <input
              type="file" accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={(e) => setForm({ ...form, poster: e.target.files?.[0] || null })}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <button type="submit" disabled={posting} className="rounded-xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
            {posting ? 'Posting…' : 'Post Church-wide'}
          </button>
        </form>
      </div>

      <div className="grid gap-4">
        {items.map((a) => (
          <div key={a.id} className="rounded-2xl bg-white p-4 flex justify-between items-start border">
            <div>
              {a.poster && <img src={a.poster} alt="" className="mb-3 max-w-xs rounded-xl border border-slate-200" />}
              <div className="font-semibold">{a.title}</div>
              <div className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{a.body}</div>
              <div className="text-xs text-slate-400 mt-2">{new Date(a.created_at).toLocaleString()}</div>
            </div>
            <button onClick={() => handleDelete(a.id)} className="text-red-600 text-sm shrink-0">Delete</button>
          </div>
        ))}
        {items.length === 0 && <div className="text-slate-500 text-sm">No church-wide announcements yet.</div>}
      </div>
    </div>
  )
}
