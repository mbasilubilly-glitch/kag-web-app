import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getAuthToken } from '../api'
import { CommunityGraphic } from '../components/ChurchGraphics'
import useAuth from '../hooks/useAuth'
import useCurrentUser from '../hooks/useCurrentUser'
import Avatar from '../components/Avatar'
import ExecutiveDashboard from '../components/ExecutiveDashboard'
import MyActivityDashboard from '../components/MyActivityDashboard'

const ADMIN_ACTIONS = [
  { href: '/admin/users', icon: '🧑‍🤝‍🧑', title: 'Manage Users', desc: 'Review, approve, suspend, and assign roles' },
  { href: '/admin/department-admin-assignments', icon: '🗂️', title: 'Department Admins', desc: 'Assign administrators to departments' },
  { href: '/admin/announcements', icon: '📣', title: 'Announcements', desc: 'Post church-wide updates' },
  { href: '/admin/events', icon: '📅', title: 'Events', desc: 'Create and manage church events' },
  { href: '/admin/audit-log', icon: '📜', title: 'Audit Log', desc: 'Every role change, in order' },
]

const MEMBER_ACTIONS = [
  { href: '/my-console', icon: '🗄️', title: 'My Console', desc: 'Your events, prayer requests, attendance, and profile in one place' },
  { href: '/departments', icon: '🏘️', title: 'Departments & Homecells', desc: 'Manage your homecell and ministry preferences' },
  { href: '/my-homecell', icon: '🏠', title: 'My Homecell', desc: 'View your homecell\'s meeting details and info' },
  { href: '/live', icon: '📡', title: 'Live & Service Times', desc: 'Join the stream or see when we meet' },
  { href: '/announcements', icon: '📣', title: 'Announcements', desc: 'Church-wide and department updates' },
  { href: '/sermons', icon: '🎥', title: 'Watch Sermons', desc: 'Access all available messages and teachings' },
  { href: '/events', icon: '📅', title: 'Events & Registration', desc: 'Browse and register for upcoming events' },
  { href: '/profile', icon: '👤', title: 'My Profile', desc: 'View and update your account information' },
]

function BecomeMemberCard() {
  const [membershipStatus, setMembershipStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const loadStatus = () => {
    api.get('/membership-upgrade/mine/')
      .then((res) => setMembershipStatus(res.data?.membership_upgrade_status || 'NONE'))
      .catch(() => setMembershipStatus(null))
  }

  useEffect(() => { loadStatus() }, [])

  const requestUpgrade = async () => {
    setError('')
    setBusy(true)
    try {
      await api.post('/membership-upgrade/request/')
      setMembershipStatus('PENDING')
    } catch (e) {
      setError(e?.response?.data?.detail || 'Unable to send your request. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (membershipStatus === null || membershipStatus === undefined) return null

  return (
    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg border-t-4 border-secondary-500 p-8">
      <div className="flex items-center gap-4">
        <span className="text-4xl">🙋</span>
        <div className="flex-1">
          <h2 className="font-display text-xl font-bold text-primary-800 dark:text-primary-300">Want to become a Member?</h2>
          {membershipStatus === 'PENDING' ? (
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Your request has been sent to the church admins and is awaiting review.</p>
          ) : membershipStatus === 'REJECTED' ? (
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Your previous request wasn't approved. You can request again below.</p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Request to become a full Member and a church admin will be notified to review it.</p>
          )}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
        {membershipStatus !== 'PENDING' && (
          <button
            onClick={requestUpgrade}
            disabled={busy}
            className="rounded-2xl bg-secondary-600 text-white px-5 py-3 font-semibold disabled:opacity-60 whitespace-nowrap"
          >
            {busy ? 'Sending…' : 'Become a Member'}
          </button>
        )}
      </div>
    </div>
  )
}

function ActionCard({ href, icon, title, desc }) {
  return (
    <Link to={href} className="group rounded-xl bg-gradient-card dark:bg-slate-700/40 border border-primary-200 dark:border-primary-800 p-6 hover:shadow-lg transition">
      <div className="flex items-center gap-4">
        <span className="text-4xl group-hover:scale-110 transition">{icon}</span>
        <div>
          <h3 className="font-display font-bold text-primary-800 dark:text-primary-300 group-hover:text-primary-600 transition">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">{desc}</p>
        </div>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [details, setDetails] = useState(null)
  const [myDepartments, setMyDepartments] = useState([])

  const { isAdmin, role } = useAuth()
  const userRole = role || 'Member'
  const currentUser = useCurrentUser()

  useEffect(() => {
    api.get('/department-admin-assignments/mine/')
      .then((res) => setMyDepartments(res.data || []))
      .catch(() => setMyDepartments([]))
  }, [])

  const loadSummary = async () => {
    // If user token is missing/expired, avoid endless retries and guide user to sign-in.
    const token = getAuthToken()
    if (!token) {
      setSummary(null)
      setError('Session expired. Please sign in again.')
      setDetails(null)
      setLoading(false)
      return
    }

    setError('')
    setLoading(true)

    let controller = new AbortController()

    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 8000)

    try {
      const response = await api.get('/dashboard-summary/', { signal: controller.signal })
      setSummary(response.data)
    } catch (e) {
      setSummary(null)
      const status = e?.response?.status
      const detail = e?.response?.data?.detail || e?.response?.data?.message
      setDetails({ status, detail })
      setError('Unable to load dashboard summary.')
    } finally {

      clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [])

  const headerCopy = isAdmin
    ? { title: '⚙️ Admin Dashboard', sub: 'Manage members, departments, sermons, events, and announcements across the church.' }
    : myDepartments.length > 0
      ? { title: '🗂️ Department Admin Dashboard', sub: `You administer ${myDepartments.length} department${myDepartments.length > 1 ? 's' : ''}. Jump into your console below.` }
      : { title: '📊 Member Dashboard', sub: 'Welcome! Access your profile, sermons, and event registrations all in one place.' }

  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <section className="relative bg-gradient-hero text-white px-4 py-12 md:py-16 overflow-hidden">
        <CommunityGraphic className="hidden md:block absolute -right-6 -top-10 w-64 h-64 opacity-20 pointer-events-none" />
        <div className="container max-w-4xl mx-auto relative">
          <div className="flex items-center gap-4 mb-4">
            <Avatar src={currentUser?.avatarSrc} name={currentUser?.name} size={56} className="ring-2 ring-white/40" />
            <div>
              <p className="text-primary-100 text-sm">Welcome back,</p>
              <p className="font-display text-xl font-bold">{currentUser?.name || 'there'}</p>
            </div>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">{headerCopy.title}</h1>
          <p className="text-lg text-primary-100">{headerCopy.sub}</p>
          {!isAdmin && <span className="inline-block mt-4 px-3 py-1 rounded-full bg-white/15 text-sm font-semibold">{userRole}</span>}
        </div>
      </section>

      {/* Content */}
      <div className="container px-4 py-12">
        {summary ? (
          <div className="space-y-8">
            {myDepartments.length > 0 && (
              <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg border-t-4 border-secondary-500 p-8">
                <h2 className="font-display text-2xl font-bold text-primary-800 dark:text-primary-300 mb-6">My Departments</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {myDepartments.map((a) => (
                    <Link
                      key={a.id}
                      to={`/ministries/${a.department.id}/dashboard`}
                      className="group rounded-xl bg-gradient-card dark:bg-slate-700/40 border border-primary-200 dark:border-primary-800 p-6 hover:shadow-lg transition"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-4xl group-hover:scale-110 transition">🗂️</span>
                        <div>
                          <h3 className="font-display font-bold text-primary-800 dark:text-primary-300 group-hover:text-primary-600 transition">{a.department.ministry_name}</h3>
                          <p className="text-sm text-gray-600 dark:text-slate-400">Open department console</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {isAdmin && summary.pending_approvals > 0 && (
              <Link
                to="/admin/users"
                className="block bg-secondary-50 dark:bg-secondary-900/30 border-2 border-secondary-300 dark:border-secondary-700 rounded-2xl p-6 hover:shadow-lg transition"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🔔</span>
                  <div>
                    <h3 className="font-display font-bold text-primary-800 dark:text-primary-300">{summary.pending_approvals} registration{summary.pending_approvals > 1 ? 's' : ''} awaiting approval</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Review and approve or reject new member requests</p>
                  </div>
                </div>
              </Link>
            )}

            {isAdmin && summary.membership_upgrade_requests > 0 && (
              <Link
                to="/admin/membership-requests"
                className="block bg-secondary-50 dark:bg-secondary-900/30 border-2 border-secondary-300 dark:border-secondary-700 rounded-2xl p-6 hover:shadow-lg transition"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🙋</span>
                  <div>
                    <h3 className="font-display font-bold text-primary-800 dark:text-primary-300">{summary.membership_upgrade_requests} visitor{summary.membership_upgrade_requests > 1 ? 's' : ''} requesting to become a Member</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Review and approve or reject membership upgrade requests</p>
                  </div>
                </div>
              </Link>
            )}

            {!isAdmin && userRole === 'Visitor' && <BecomeMemberCard />}

            {/* Church Executive Dashboard - the first thing an Administrator/
                Pastor sees after login: 13 headline stats + 10 charts.
                Members instead see a simpler stats grid + community stats
                below. */}
            {isAdmin ? (
              <ExecutiveDashboard />
            ) : (
              <>
              <MyActivityDashboard />
              <div className="grid gap-6 md:grid-cols-3">
                {[
                  {
                    label: 'Total Members',
                    value: summary.total_members,
                    icon: '👥',
                    color: 'from-primary-500 to-primary-600'
                  },
                  {
                    label: 'Total Sermons',
                    value: summary.total_sermons,
                    icon: '🎥',
                    color: 'from-secondary-500 to-secondary-600'
                  },
                  {
                    label: 'Total Events',
                    value: summary.total_events,
                    icon: '📅',
                    color: 'from-accent-500 to-accent-600'
                  },
                ].map((item) => (
                  <div key={item.label} className={`bg-gradient-to-br ${item.color} rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition transform hover:-translate-y-2`}>
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-sm font-semibold uppercase tracking-wide opacity-90">{item.label}</span>
                      <span className="text-3xl">{item.icon}</span>
                    </div>
                    <p className="text-5xl font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
              </>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg border-t-4 border-primary-600 p-8">
              <h2 className="font-display text-2xl font-bold text-primary-800 dark:text-primary-300 mb-6">{isAdmin ? 'Admin Quick Actions' : 'Quick Actions'}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {(isAdmin ? ADMIN_ACTIONS : MEMBER_ACTIONS).map((action) => (
                  <ActionCard key={action.href} {...action} />
                ))}
              </div>
            </div>

            {/* Additional Info - members only; admins get the same numbers
                (and more) in the Executive Dashboard above. */}
            {!isAdmin && (
              <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg p-8 border-t-4 border-secondary-500">
                <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-300 mb-4">Community Stats</h2>
                <div className="grid md:grid-cols-2 gap-6 text-gray-700 dark:text-slate-300">
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-slate-700">
                    <span className="text-3xl">👥</span>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-slate-400">Total Members</p>
                      <p className="text-xl font-bold text-primary-600 dark:text-primary-400">{summary.total_members} Members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-slate-700">
                    <span className="text-3xl">🎓</span>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-slate-400">Available Resources</p>
                      <p className="text-xl font-bold text-secondary-600 dark:text-secondary-400">{summary.total_sermons + summary.total_events} Items</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="text-center py-16">
            <div className="inline-block">
              <div className="w-16 h-16 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-gray-600 dark:text-slate-400 text-lg">Loading your dashboard...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-danger-50 dark:bg-red-950/40 border-2 border-danger-200 dark:border-red-900 p-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-danger-800 dark:text-red-300 mb-3">{error}</h2>
            {details?.status && (
              <p className="text-sm text-danger-700 dark:text-red-400 mb-2">Status: {details.status}</p>
            )}
            {details?.detail && (
              <p className="text-sm text-danger-700 dark:text-red-400 mb-6 whitespace-pre-wrap">{details.detail}</p>
            )}
            <button
              onClick={loadSummary}
              className="px-8 py-3 bg-danger-600 text-white font-bold rounded-lg hover:bg-danger-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-gray-100 dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600 p-12 text-center">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-gray-700 dark:text-slate-300 font-semibold text-lg">No dashboard summary available</p>
            <p className="text-gray-600 dark:text-slate-400 mt-2">Check back soon</p>
          </div>
        )}
      </div>
    </div>
  )
}
