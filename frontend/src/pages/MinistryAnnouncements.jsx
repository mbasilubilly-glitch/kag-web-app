import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'
import MinistryGuard from '../components/MinistryGuard'
import MinistryConsoleNav from '../components/MinistryConsoleNav'
import { extractErrorMessage as readableError } from '../utils/errors'

export default function MinistryAnnouncements() {
  const { id } = useParams()
  const [ministry, setMinistry] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [posting, setPosting] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', poster: null })

  const loadAnnouncements = () => api.get(`/announcements/?ministry=${id}`).then((res) => setAnnouncements(res.data))

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')
    Promise.all([api.get(`/ministries/${id}/`), loadAnnouncements()])
      .then(([ministryRes]) => { if (mounted) setMinistry(ministryRes.data) })
      .catch(() => { if (mounted) setError('Unable to load announcements.') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const postAnnouncement = async (e) => {
    e.preventDefault()
    setError('')
    setPosting(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('body', form.body)
      fd.append('ministry', Number(id))
      if (form.poster) fd.append('poster', form.poster)
      await api.post('/announcements/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm({ title: '', body: '', poster: null })
      await loadAnnouncements()
    } catch (err) {
      setError(readableError(err, 'Unable to post announcement.'))
    } finally {
      setPosting(false)
    }
  }

  const deleteAnnouncement = async (announcementId) => {
    if (!confirm('Delete this announcement?')) return
    try {
      await api.delete(`/announcements/${announcementId}/`)
      await loadAnnouncements()
    } catch (err) {
      setError(readableError(err, 'Unable to delete announcement.'))
    }
  }

  return (
    <MinistryGuard ministryId={id}>
      <div className="container py-10">
        <MinistryConsoleNav ministryId={id} ministryName={ministry?.ministry_name} />

        {error && <div className="p-4 bg-red-100 text-red-800 rounded mb-4">{error}</div>}

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 mb-6">
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
              {posting ? 'Posting…' : 'Post to Department'}
            </button>
          </form>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold mb-4">Recent Announcements</h2>
          {loading && <div className="text-slate-600">Loading…</div>}
          {!loading && announcements.length === 0 && <div className="text-slate-600">No announcements yet.</div>}
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {a.poster && <img src={a.poster} alt="" className="mb-3 max-w-xs rounded-xl border border-slate-200" />}
                    <div className="font-medium">{a.title}</div>
                    <div className="text-slate-600 text-sm mt-1 whitespace-pre-wrap">{a.body}</div>
                    <div className="text-slate-400 text-xs mt-2">
                      {a.created_by_name} · {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                  <button onClick={() => deleteAnnouncement(a.id)} className="rounded-lg border border-red-300 text-red-600 px-3 py-1.5 text-xs font-semibold shrink-0">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MinistryGuard>
  )
}
