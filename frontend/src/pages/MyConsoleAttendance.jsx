import { useEffect, useState } from 'react'
import api from '../api'
import MyConsoleNav from '../components/MyConsoleNav'

const STATUS_STYLES = {
  present: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-700',
  excused: 'bg-amber-100 text-amber-800',
  visitor: 'bg-blue-100 text-blue-800',
}

export default function MyConsoleAttendance() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/attendance/mine/')
      .then((res) => setRecords(res.data || []))
      .catch(() => setError('Unable to load your attendance history.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container py-10">
      <MyConsoleNav />

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold mb-6">My Attendance</h2>

        {loading && <div className="text-slate-600">Loading…</div>}
        {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}

        {!loading && !error && records.length === 0 && (
          <div className="text-slate-600">No attendance records yet.</div>
        )}

        {!loading && !error && records.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4">Session</th>
                  <th className="py-2 pr-4">Department</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium">{r.session_title || '—'}</td>
                    <td className="py-3 pr-4">{r.ministry_name || '—'}</td>
                    <td className="py-3 pr-4">{r.session_date ? new Date(r.session_date).toLocaleDateString() : '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[r.status] || 'bg-slate-100 text-slate-600'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
