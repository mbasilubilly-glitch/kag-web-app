import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import BarChart from '../components/charts/BarChart'
import TrendChart from '../components/charts/TrendChart'

export default function AdminMinistryDashboard() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/admin/ministries/dashboard-summary/')
      .then((res) => setSummary(res.data))
      .catch(() => setError('Unable to load the Ministries dashboard.'))
  }, [])

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Ministries Dashboard</h1>
          <p className="text-slate-600 mt-2">An overview of every ministry's activity.</p>
        </div>
        <Link to="/admin/ministries" className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold">Manage Ministries</Link>
      </div>

      {error && <div className="rounded-3xl bg-red-100 p-6 text-red-800">{error}</div>}

      {summary?.pending_join_requests > 0 && (
        <div className="rounded-3xl bg-secondary-50 border-2 border-secondary-300 p-6 shadow-sm">
          <span className="font-bold text-primary-800">
            {summary.pending_join_requests} ministry join request{summary.pending_join_requests > 1 ? 's' : ''} awaiting approval
          </span>
          <span className="block text-sm text-slate-600 mt-1">Open a ministry's "Manage" page to review its pending requests.</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-gradient-hero p-8 text-white shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-wide opacity-90">Total Ministries</div>
          <p className="text-4xl font-display font-bold mt-2">{summary?.total ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-wide opacity-90">Active</div>
          <p className="text-4xl font-display font-bold mt-2">{summary?.active ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-wide opacity-90">Inactive</div>
          <p className="text-4xl font-display font-bold mt-2">{summary?.inactive ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Total Leaders</div>
          <p className="text-4xl font-bold mt-2">{summary?.total_leaders ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Total Assistant Leaders</div>
          <p className="text-4xl font-bold mt-2">{summary?.total_assistant_leaders ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Registered Members</div>
          <p className="text-4xl font-bold mt-2">{summary?.total_members ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pending Join Requests</div>
          <p className="text-4xl font-bold mt-2">{summary?.pending_join_requests ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">New Members This Month</div>
          <p className="text-4xl font-bold mt-2">{summary?.new_members_this_month ?? '—'}</p>
        </div>
        <div className={`rounded-3xl p-8 shadow-sm border ${summary?.understaffed_count > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Understaffed (&lt; {summary?.min_required_admins ?? 3} admins)
          </div>
          <p className="text-4xl font-bold mt-2">{summary?.understaffed_count ?? '—'}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-semibold mb-4">Attendance by Ministry</h2>
          <BarChart
            data={summary?.attendance_by_ministry || []}
            loading={!summary}
            valuePrefix=""
            countLabel="present mark"
          />
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-semibold mb-4">Monthly Growth (new members)</h2>
          <TrendChart data={summary?.monthly_growth || []} loading={!summary} valuePrefix="" />
        </div>
      </div>
    </div>
  )
}
