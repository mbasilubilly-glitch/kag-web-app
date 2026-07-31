import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import useAuth from '../hooks/useAuth'
import BarChart from '../components/charts/BarChart'
import TrendChart from '../components/charts/TrendChart'

const ACTIVITY_ICONS = { photo: '🖼️', video: '🎬', member: '👤' }

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

const QUICK_LINKS = [
  { label: 'Sermons', to: 'sermons', icon: '🎥' },
  { label: 'Events', to: 'events', icon: '📅' },
  { label: 'Galleries', to: 'galleries', icon: '🖼️' },
  { label: 'Gallery Categories', to: 'gallery-categories', icon: '🏷️' },
  { label: 'Live Stream', to: 'live', icon: '📡' },
]

export default function AdminMediaTeamDashboard({ basePath = '/admin/media-team' }) {
  const { isAdmin } = useAuth()
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  // basePath is either "/admin/media-team" or "/media-team" - the other
  // sections (sermons/events/galleries/live) hang off the same root rather
  // than off /media-team specifically, so derive that root instead of
  // reusing basePath verbatim.
  const rootPath = basePath.startsWith('/media-team') ? '/media-team' : '/admin'

  useEffect(() => {
    api.get('/admin/media-team/dashboard-summary/')
      .then((res) => setSummary(res.data))
      .catch(() => setError('Unable to load the Media Team dashboard.'))
  }, [])

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Media Team Dashboard</h1>
          <p className="text-slate-600 mt-2">An overview of the Media Team's roster and content activity.</p>
        </div>
        <div className="flex gap-3">
          <Link to={basePath} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold">Manage Media Team</Link>
          {isAdmin && summary?.media_team_ministry_id && (
            <Link to={`/admin/ministries/${summary.media_team_ministry_id}`} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold">Assign Leaders</Link>
          )}
        </div>
      </div>

      {error && <div className="rounded-3xl bg-red-100 p-6 text-red-800">{error}</div>}

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.to}
              to={`${rootPath}/${l.to}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 px-5 py-4 font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition"
            >
              <span className="text-xl">{l.icon}</span>
              <span>{l.label}</span>
            </Link>
          ))}
          <Link
            to={basePath}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 px-5 py-4 font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition"
          >
            <span className="text-xl">👥</span>
            <span>Media Team</span>
          </Link>
        </div>
      </div>

      {summary?.pending_join_requests > 0 && (
        <div className="rounded-3xl bg-secondary-50 border-2 border-secondary-300 p-6 shadow-sm">
          <span className="font-bold text-primary-800">
            {summary.pending_join_requests} Media Team join request{summary.pending_join_requests > 1 ? 's' : ''} awaiting approval
          </span>
          <span className="block text-sm text-slate-600 mt-1">Review them from the "Manage Media Team" page.</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-gradient-hero p-8 text-white shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-wide opacity-90">Total Media Team Members</div>
          <p className="text-4xl font-display font-bold mt-2">{summary?.total_members ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-wide opacity-90">Active Members</div>
          <p className="text-4xl font-display font-bold mt-2">{summary?.active_members ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pending Join Requests</div>
          <p className="text-4xl font-bold mt-2">{summary?.pending_join_requests ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Team Leaders</div>
          <p className="text-4xl font-bold mt-2">{summary?.total_leaders ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Assistant Leaders</div>
          <p className="text-4xl font-bold mt-2">{summary?.total_assistant_leaders ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent Uploads (30 days)</div>
          <p className="text-4xl font-bold mt-2">{summary?.recent_uploads_last_30_days ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Total Uploaded Photos</div>
          <p className="text-4xl font-bold mt-2">{summary?.total_photos ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Total Uploaded Videos</div>
          <p className="text-4xl font-bold mt-2">{summary?.total_videos ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Total Sermons</div>
          <p className="text-4xl font-bold mt-2">{summary?.total_sermons ?? '—'}</p>
        </div>
        <div className={`rounded-3xl p-8 shadow-sm border ${summary?.pending_media_publications > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pending Media Publications</div>
          <p className="text-4xl font-bold mt-2">{summary?.pending_media_publications ?? '—'}</p>
          <p className="text-xs text-slate-500 mt-1">Draft galleries not yet published</p>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming Church Services</div>
          <p className="text-4xl font-bold mt-2">{summary?.upcoming_church_services ?? '—'}</p>
          <p className="text-xs text-slate-500 mt-1">Next 7 days</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-semibold mb-4">Upload Trend (photos + videos + sermons)</h2>
          <TrendChart data={summary?.monthly_uploads || []} loading={!summary} valuePrefix="" />
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-semibold mb-4">Team Roles</h2>
          <BarChart
            data={summary?.role_breakdown || []}
            loading={!summary}
            valuePrefix=""
            countLabel="member"
          />
        </div>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {!summary ? (
          <div className="text-slate-500 text-sm">Loading…</div>
        ) : !summary.recent_activity?.length ? (
          <div className="text-slate-500 text-sm">No recent activity yet.</div>
        ) : (
          <div className="grid gap-2">
            {summary.recent_activity.map((a, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3">
                <span className="flex items-center gap-3">
                  <span className="text-xl">{ACTIVITY_ICONS[a.type] || '•'}</span>
                  <span className="text-slate-800 text-sm">{a.label}</span>
                </span>
                <span className="text-slate-400 text-xs shrink-0">{timeAgo(a.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
