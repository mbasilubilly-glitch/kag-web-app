import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'
import MinistryGuard from '../components/MinistryGuard'
import MinistryConsoleNav from '../components/MinistryConsoleNav'
import BarChart from '../components/charts/BarChart'
import TrendChart from '../components/charts/TrendChart'

export default function MinistryReports() {
  const { id } = useParams()
  const [ministry, setMinistry] = useState(null)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    api.get(`/ministries/${id}/`).then((res) => { if (mounted) setMinistry(res.data) }).catch(() => {})
    api.get(`/ministries/${id}/reports/summary/`)
      .then((res) => { if (mounted) setSummary(res.data) })
      .catch(() => { if (mounted) setError('Unable to load reports for this department.') })
    return () => { mounted = false }
  }, [id])

  const cellLabel = ministry?.category === 'homecell' ? 'Home Cell' : 'Department'

  return (
    <MinistryGuard ministryId={id}>
      <div className="container py-10">
        <MinistryConsoleNav ministryId={id} ministryName={ministry?.ministry_name} />

        {error && <div className="rounded-3xl bg-red-100 p-6 text-red-800 mb-6">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">{cellLabel} Members</div>
            <p className="text-4xl font-bold mt-2">{summary?.total_members ?? '—'}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Attendance Sessions</div>
            <p className="text-4xl font-bold mt-2">{summary?.total_sessions ?? '—'}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Average Attendance / Session</div>
            <p className="text-4xl font-bold mt-2">{summary?.average_attendance ?? '—'}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
            <h2 className="text-xl font-semibold mb-4">Attendance Trend (last 12 sessions)</h2>
            <TrendChart data={summary?.attendance_trend || []} loading={!summary && !error} valuePrefix="" />
          </div>
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
            <h2 className="text-xl font-semibold mb-4">Monthly Growth (new members)</h2>
            <TrendChart data={summary?.member_growth || []} loading={!summary && !error} valuePrefix="" />
          </div>
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Attendance Status Breakdown</h2>
            <BarChart
              data={summary?.status_breakdown || []}
              loading={!summary && !error}
              valuePrefix=""
              countLabel="mark"
            />
          </div>
        </div>
      </div>
    </MinistryGuard>
  )
}
