import { Link, useLocation } from 'react-router-dom'

const TABS = [
  { href: '/my-console', label: 'Dashboard' },
  { href: '/my-console/events', label: 'My Events' },
  { href: '/my-console/prayer-requests', label: 'Prayer Requests' },
  { href: '/my-console/attendance', label: 'My Attendance' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/profile', label: 'Profile' },
]

// Personal console for every signed-in Member/Visitor - same idea as
// MinistryConsoleNav, but for one's own stuff instead of a department's.
// Two tabs (Notifications, Profile) point at pre-existing full-featured
// pages rather than duplicating them here - this nav is just embedded at
// the top of those pages too, so the tab bar persists across all six.
export default function MyConsoleNav() {
  const location = useLocation()

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 mb-6">
      <p className="text-sm text-slate-500 mb-1">My Console</p>
      <h1 className="text-2xl font-bold mb-4">My Account</h1>
      <nav className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = location.pathname === tab.href
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
