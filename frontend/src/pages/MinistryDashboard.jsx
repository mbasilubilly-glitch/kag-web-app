import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'
import MinistryGuard from '../components/MinistryGuard'
import MinistryConsoleNav from '../components/MinistryConsoleNav'

export default function MinistryDashboard() {
  const { id } = useParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ministry, setMinistry] = useState(null)
  const [stats, setStats] = useState({ members: 0, events: 0, sessions: 0, announcements: 0 })

  useEffect(() => {
    let mounted = true

    setLoading(true)
    setError('')

    Promise.all([
      api.get(`/ministries/${id}/`),
      api.get(`/ministries/${id}/members/`),
      api.get(`/events/?ministry=${id}`),
      api.get(`/ministries/${id}/attendance/sessions/`),
      api.get(`/announcements/?ministry=${id}`),
    ])
      .then(([ministryRes, membersRes, eventsRes, sessionsRes, announcementsRes]) => {
        if (!mounted) return
        setMinistry(ministryRes.data || null)
        setStats({
          members: membersRes.data.length,
          events: eventsRes.data.length,
          sessions: sessionsRes.data.length,
          announcements: announcementsRes.data.length,
        })
      })
      .catch(() => { if (mounted) setError('Unable to load ministry dashboard.') })
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [id])

  return (
    <MinistryGuard ministryId={id}>
      <div className="container py-10">
        <MinistryConsoleNav ministryId={id} ministryName={ministry?.ministry_name} />

        {error && <div className="p-4 bg-red-100 text-red-800 rounded mb-4">{error}</div>}
        {loading && <div className="text-slate-600">Loading…</div>}

        {!loading && ministry && (
          <>
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 mb-6">
              <p className="text-slate-600">{ministry.description || 'No description set.'}</p>
              {ministry.leader && <div className="text-sm text-slate-500 mt-2">Leader: {ministry.leader}</div>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Members', value: stats.members },
                { label: 'Department Events', value: stats.events },
                { label: 'Attendance Sessions', value: stats.sessions },
                { label: 'Announcements', value: stats.announcements },
              ].map((tile) => (
                <div key={tile.label} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
                  <div className="text-3xl font-bold">{tile.value}</div>
                  <div className="text-sm text-slate-500 mt-1">{tile.label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </MinistryGuard>
  )
}
