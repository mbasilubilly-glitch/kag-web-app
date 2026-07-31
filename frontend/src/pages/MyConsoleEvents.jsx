import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import MyConsoleNav from '../components/MyConsoleNav'

export default function MyConsoleEvents() {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/event-registrations/mine/')
      .then((res) => setRegistrations(res.data || []))
      .catch(() => setError('Unable to load your event registrations.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container py-10">
      <MyConsoleNav />

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">My Events</h2>
          <Link to="/events" className="text-primary-600 font-semibold text-sm hover:underline">
            Browse Events →
          </Link>
        </div>

        {loading && <div className="text-slate-600">Loading…</div>}
        {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}

        {!loading && !error && registrations.length === 0 && (
          <div className="text-slate-600">You haven't registered for any events yet.</div>
        )}

        {!loading && !error && registrations.length > 0 && (
          <div className="space-y-3">
            {registrations.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <div>
                  <div className="font-medium">{r.event_title}</div>
                  <div className="text-slate-500 text-xs">
                    {r.event_date ? new Date(r.event_date).toLocaleString() : ''} · {r.event_venue}
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  r.status === 'Registered' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
