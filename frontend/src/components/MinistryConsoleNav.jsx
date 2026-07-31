import { Link, useLocation } from 'react-router-dom'

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'members', label: 'Members' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'events', label: 'Events' },
  { key: 'meetings', label: 'Online Meetings' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'prayer-requests', label: 'Prayer Requests' },
  { key: 'resources', label: 'Resources' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
]

export default function MinistryConsoleNav({ ministryId, ministryName }) {
  const location = useLocation()
  // Homecells are Ministry rows too (category='homecell'), reusing this
  // whole console UI unchanged - only the URL prefix/copy differ, derived
  // from the current route rather than a prop, so none of the console
  // pages need to know which context they're rendered in.
  const isHomecell = location.pathname.startsWith('/homecells')
  const basePath = isHomecell ? '/homecells' : '/ministries'

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 mb-6">
      <p className="text-sm text-slate-500 mb-1">{isHomecell ? 'Home Cell Console' : 'Department Console'}</p>
      <h1 className="text-2xl font-bold mb-4">{ministryName || (isHomecell ? 'Home Cell' : 'Ministry')}</h1>
      <nav className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const to = `${basePath}/${ministryId}/${tab.key}`
          const active = location.pathname === to
          return (
            <Link
              key={tab.key}
              to={to}
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
