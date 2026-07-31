import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import MyConsoleNav from '../components/MyConsoleNav'

const STATUS_STYLES = {
  Pending: 'bg-amber-100 text-amber-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  Answered: 'bg-green-100 text-green-800',
}

export default function MyConsolePrayerRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/prayer-requests/mine/')
      .then((res) => setRequests(res.data || []))
      .catch(() => setError('Unable to load your prayer requests.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container py-10">
      <MyConsoleNav />

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">My Prayer Requests</h2>
          <Link to="/prayer-request" className="text-primary-600 font-semibold text-sm hover:underline">
            Submit a Prayer Request →
          </Link>
        </div>

        {loading && <div className="text-slate-600">Loading…</div>}
        {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}

        {!loading && !error && requests.length === 0 && (
          <div className="text-slate-600">You haven't submitted any prayer requests yet.</div>
        )}

        {!loading && !error && requests.length > 0 && (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[r.status] || 'bg-slate-100 text-slate-600'}`}>
                    {r.status}
                  </span>
                  <span className="text-slate-400 text-xs">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-700 text-sm">{r.request}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
