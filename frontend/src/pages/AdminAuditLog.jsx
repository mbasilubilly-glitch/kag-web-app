import { useEffect, useState } from 'react'
import api from '../api'

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/role-audit-logs/')
      .then((res) => setLogs(res.data))
      .catch((err) => {
        if (err?.response?.status === 403) {
          setError('Only the Super Administrator can view the audit log.')
        } else {
          setError('Unable to load the audit log.')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Role Audit Log</h1>
        <p className="text-slate-600 mt-1 text-sm">Every role change made in the system, in order, newest first.</p>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}
      {loading && <div className="text-slate-600">Loading…</div>}

      {!loading && !error && logs.length === 0 && (
        <div className="rounded-3xl bg-white p-8 shadow-sm border text-slate-600">No role changes have been recorded yet.</div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="rounded-3xl bg-white p-6 shadow-sm border overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Actor</th>
                <th className="py-2 pr-4">Target</th>
                <th className="py-2 pr-4">Old Role</th>
                <th className="py-2 pr-4">New Role</th>
                <th className="py-2 pr-4">Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-3 pr-4">{log.actor_name || '—'}</td>
                  <td className="py-3 pr-4 font-medium">{log.target_user_name || '—'}</td>
                  <td className="py-3 pr-4 text-slate-500">{log.old_role || '—'}</td>
                  <td className="py-3 pr-4 font-semibold">{log.new_role || '—'}</td>
                  <td className="py-3 pr-4 text-slate-500">{log.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
