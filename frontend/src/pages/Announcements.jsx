import { useEffect, useState } from 'react'
import api from '../api'

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    api.get('/announcements/')
      .then((res) => { if (mounted) setAnnouncements(res.data) })
      .catch(() => { if (mounted) setError('Unable to load announcements.') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  return (
    <div className="container py-10">
      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 mb-6">
        <h1 className="text-3xl font-bold">Announcements</h1>
        <p className="text-slate-600 mt-2">Church-wide and department announcements.</p>
      </div>

      {loading && <div className="text-slate-600">Loading…</div>}
      {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}
      {!loading && !error && announcements.length === 0 && (
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 text-slate-600">
          No announcements yet.
        </div>
      )}

      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${a.ministry ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-700'}`}>
                {a.ministry_name || 'Church-wide'}
              </span>
            </div>
            {a.poster && <img src={a.poster} alt="" className="mb-4 w-full max-w-md rounded-2xl border border-slate-200" />}
            <h2 className="text-lg font-semibold">{a.title}</h2>
            <p className="text-slate-600 mt-2 whitespace-pre-wrap">{a.body}</p>
            <div className="text-slate-400 text-xs mt-3">
              {a.created_by_name} · {new Date(a.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
