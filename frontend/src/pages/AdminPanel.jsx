import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

const QUICK_LINKS = [
  { to: '/admin/users', label: 'Manage Users' },
  { to: '/admin/sermons', label: 'Manage Sermons' },
  { to: '/admin/events', label: 'Manage Events' },
  { to: '/admin/ministries', label: 'Manage Ministries' },
  { to: '/admin/ministries/dashboard', label: 'Ministries Dashboard' },
  { to: '/admin/homecells', label: 'Manage Home Cells' },
  { to: '/admin/homecells/dashboard', label: 'Home Cell Dashboard' },
  { to: '/admin/media-team', label: 'Manage Media Team' },
  { to: '/admin/media-team/dashboard', label: 'Media Team Dashboard' },
  { to: '/admin/department-admin-assignments', label: 'Assign Department Admins' },
  { to: '/admin/announcements', label: 'Post Announcements' },
  { to: '/admin/analytics', label: 'System Analytics' },
  { to: '/admin/notifications', label: 'Send Notifications' },
  { to: '/admin/contact-inbox', label: 'Contact Inbox' },
  { to: '/admin/audit-log', label: 'Audit Log' },
]

export default function AdminPanel() {
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    api.get('/dashboard-summary/').then((res) => setSummary(res.data)).catch(() => {})
  }, [])

  return (
    <div className="container py-10 space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
        <p className="text-slate-600 mt-2">Manage members, departments, sermons, events, and communication for the church.</p>
      </div>

      {summary?.pending_approvals > 0 && (
        <Link to="/admin/users" className="block rounded-3xl bg-secondary-50 border-2 border-secondary-300 p-6 shadow-sm hover:shadow-md transition">
          <span className="font-display font-bold text-primary-800">
            {summary.pending_approvals} registration{summary.pending_approvals > 1 ? 's' : ''} awaiting approval
          </span>
          <span className="block text-sm text-slate-600 mt-1">Review new member requests</span>
        </Link>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-gradient-hero p-8 text-white shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-wide opacity-90">Members</div>
          <p className="text-4xl font-display font-bold mt-2">{summary?.total_members ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-wide opacity-90">Sermons</div>
          <p className="text-4xl font-display font-bold mt-2">{summary?.total_sermons ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-wide opacity-90">Events</div>
          <p className="text-4xl font-display font-bold mt-2">{summary?.total_events ?? '—'}</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="font-display text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-2xl border border-slate-900 px-6 py-4 text-center font-semibold text-slate-900 hover:bg-slate-100 transition"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
