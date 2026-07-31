import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import TrendChart from '../components/charts/TrendChart'

export default function AdminSystemAnalytics() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/admin/analytics/system-summary/')
      .then((res) => setSummary(res.data))
      .catch(() => setError('Unable to load system analytics.'))
  }, [])

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">System Analytics</h1>
          <p className="text-slate-600 mt-2">Growth and activity across the entire church system.</p>
        </div>
      </div>

      {error && <div className="rounded-3xl bg-red-100 p-6 text-red-800">{error}</div>}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-gradient-hero p-8 text-white shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-wide opacity-90">Total Members</div>
          <p className="text-4xl font-display font-bold mt-2">{summary?.total_members ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-wide opacity-90">Total Visitors</div>
          <p className="text-4xl font-display font-bold mt-2">{summary?.total_visitors ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Administrators</div>
          <p className="text-4xl font-bold mt-2">{summary?.total_administrators ?? '—'}</p>
        </div>
        <div className={`rounded-3xl p-8 shadow-sm border ${summary?.pending_approvals > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pending Approvals</div>
          <p className="text-4xl font-bold mt-2">{summary?.pending_approvals ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Ministry Members</div>
          <p className="text-4xl font-bold mt-2">{summary?.total_ministries_members ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Media Team Members</div>
          <p className="text-4xl font-bold mt-2">{summary?.total_media_team_members ?? '—'}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Ministries</h3>
            <Link to="/admin/ministries" className="text-xs text-primary-600 hover:underline">Manage →</Link>
          </div>
          <p className="text-sm text-slate-600">{summary?.ministries?.total ?? '—'} total · {summary?.ministries?.active ?? '—'} active</p>
          {summary?.ministries?.understaffed > 0 && (
            <p className="text-xs text-amber-700 mt-2">{summary.ministries.understaffed} understaffed (below {summary ? summary.max_department_admins : 3} admins)</p>
          )}
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Home Cells</h3>
            <Link to="/admin/homecells" className="text-xs text-primary-600 hover:underline">Manage →</Link>
          </div>
          <p className="text-sm text-slate-600">{summary?.homecells?.total ?? '—'} total · {summary?.homecells?.active ?? '—'} active</p>
          {summary?.homecells?.understaffed > 0 && (
            <p className="text-xs text-amber-700 mt-2">{summary.homecells.understaffed} understaffed (below {summary ? summary.max_department_admins : 3} admins)</p>
          )}
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Media Team</h3>
            <Link to="/admin/media-team" className="text-xs text-primary-600 hover:underline">Manage →</Link>
          </div>
          <p className="text-sm text-slate-600">{summary?.total_media_team_members ?? '—'} active members</p>
          {summary?.media_team_understaffed && (
            <p className="text-xs text-amber-700 mt-2">Understaffed (below {summary.max_department_admins} admins)</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-semibold mb-4">Membership Growth</h2>
          <TrendChart data={summary?.membership_growth || []} loading={!summary} valuePrefix="" />
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-semibold mb-4">Attendance Across Ministries &amp; Home Cells</h2>
          <TrendChart data={summary?.attendance_trend || []} loading={!summary} valuePrefix="" />
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-semibold mb-4">Content Activity (photos + videos + sermons)</h2>
          <TrendChart data={summary?.content_trend || []} loading={!summary} valuePrefix="" />
        </div>
      </div>
    </div>
  )
}
