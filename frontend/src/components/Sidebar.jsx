import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../api'
import useAuth from '../hooks/useAuth'
import useCurrentUser from '../hooks/useCurrentUser'
import useUnseenNotifications from '../hooks/useUnseenNotifications'
import Avatar from './Avatar'

export default function Sidebar({ isOpen = false, onClose }) {
  const handleLinkClick = () => {
    if (onClose) onClose()
  }

  const { isAuthenticated: hasToken, isAdmin, isMediaTeam, signOut } = useAuth()
  const [myDepartments, setMyDepartments] = useState([])
  const location = useLocation()
  const currentUser = useCurrentUser()
  const hasUnseenNotifications = useUnseenNotifications()

  useEffect(() => {
    if (!hasToken) {
      setMyDepartments([])
      return
    }
    let mounted = true
    api.get('/department-admin-assignments/mine/')
      .then((res) => { if (mounted) setMyDepartments(res.data || []) })
      .catch(() => { if (mounted) setMyDepartments([]) })
    return () => { mounted = false }
  }, [hasToken])

  const navItems = useMemo(
    () => [
      { label: 'Home', to: '/', icon: '🏠' },
      { label: 'About Us', to: '/about', icon: 'ℹ️' },
      { label: 'Sermons', to: '/sermons', icon: '🎥' },
      { label: 'Events', to: '/events', icon: '📅' },
      { label: 'Gallery', to: '/galleries', icon: '🖼️' },
      { label: 'Live', to: '/live', icon: '📡' },
      { label: 'Worship', to: '/worship', icon: '🎶' },
      { label: 'Dream Centre', to: '/dream-centre', icon: '🌟' },
      { label: 'Ministries', to: '/ministries', icon: '🤝' },
      { label: 'Campus', to: '/campus', icon: '📍' },
      { label: 'Contact', to: '/contact', icon: '📞' },
    ],
    []
  )

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/'
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }

  const authLinks = hasToken ? (
    <>
      <Link
        to="/signin"
        onClick={(e) => {
          e.preventDefault()
        }}
        className="hidden"
      />
      <Link
        to="/dashboard"
        onClick={handleLinkClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition mb-1 ${
          isActive('/dashboard') ? 'bg-secondary-400 text-primary-800 shadow-md' : 'text-primary-50 hover:bg-primary-600/50'
        }`}
      >
        <span className="text-lg">📊</span>
        <span>Dashboard</span>
      </Link>
      {isAdmin && (
        <Link
          to="/admin"
          onClick={handleLinkClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition mb-1 ${
            isActive('/admin') ? 'bg-secondary-400 text-primary-800 shadow-md' : 'text-primary-50 hover:bg-primary-600/50'
          }`}
        >
          <span className="text-lg">⚙️</span>
          <span>Admin</span>
        </Link>
      )}
      {!isAdmin && isMediaTeam && (
        <>
          <Link
            to="/media-team/dashboard"
            onClick={handleLinkClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition mb-1 ${
              location.pathname === '/media-team/dashboard' ? 'bg-secondary-400 text-primary-800 shadow-md' : 'text-primary-50 hover:bg-primary-600/50'
            }`}
          >
            <span className="text-lg">🖼️</span>
            <span>Media Team</span>
          </Link>
          <Link
            to="/media-team/galleries"
            onClick={handleLinkClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition mb-1 ${
              location.pathname.startsWith('/media-team/galleries') ? 'bg-secondary-400 text-primary-800 shadow-md' : 'text-primary-50 hover:bg-primary-600/50'
            }`}
          >
            <span className="text-lg">📷</span>
            <span>Galleries</span>
          </Link>
          <Link
            to="/media-team/sermons"
            onClick={handleLinkClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition mb-1 ${
              location.pathname.startsWith('/media-team/sermons') ? 'bg-secondary-400 text-primary-800 shadow-md' : 'text-primary-50 hover:bg-primary-600/50'
            }`}
          >
            <span className="text-lg">🎥</span>
            <span>Sermons</span>
          </Link>
          <Link
            to="/media-team/live"
            onClick={handleLinkClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition mb-1 ${
              location.pathname.startsWith('/media-team/live') ? 'bg-secondary-400 text-primary-800 shadow-md' : 'text-primary-50 hover:bg-primary-600/50'
            }`}
          >
            <span className="text-lg">📡</span>
            <span>Live Stream</span>
          </Link>
        </>
      )}
      {myDepartments.length > 0 && (
        <div className="mt-3 mb-1">
          <div className="text-xs font-semibold text-primary-200 px-4 mb-2 uppercase tracking-wide">My Departments</div>
          {myDepartments.map((a) => (
            <Link
              key={a.id}
              to={`/ministries/${a.department.id}/dashboard`}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition mb-1 ${
                location.pathname.startsWith(`/ministries/${a.department.id}`) ? 'bg-secondary-400 text-primary-800 shadow-md' : 'text-primary-50 hover:bg-primary-600/50'
              }`}
            >
              <span className="text-lg">🗂️</span>
              <span>{a.department.ministry_name}</span>
            </Link>
          ))}
        </div>
      )}
      <Link
        to="/my-console"
        onClick={handleLinkClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition mb-1 ${
          isActive('/my-console') ? 'bg-secondary-400 text-primary-800 shadow-md' : 'text-primary-50 hover:bg-primary-600/50'
        }`}
      >
        <span className="text-lg">🗄️</span>
        <span>My Console</span>
      </Link>
      <Link
        to="/profile"
        onClick={handleLinkClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition mb-1 ${
          isActive('/profile') ? 'bg-secondary-400 text-primary-800 shadow-md' : 'text-primary-50 hover:bg-primary-600/50'
        }`}
      >
        <span className="text-lg">👤</span>
        <span>Profile</span>
      </Link>
      <Link
        to="/notifications"
        onClick={handleLinkClick}
        className={`relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition mb-1 ${
          isActive('/notifications') ? 'bg-secondary-400 text-primary-800 shadow-md' : 'text-primary-50 hover:bg-primary-600/50'
        }`}
      >
        <span className="relative text-lg">
          🔔
          {hasUnseenNotifications && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-primary-800" />
          )}
        </span>
        <span>Notifications</span>
      </Link>
      <Link
        to="/announcements"
        onClick={handleLinkClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition mb-1 ${
          isActive('/announcements') ? 'bg-secondary-400 text-primary-800 shadow-md' : 'text-primary-50 hover:bg-primary-600/50'
        }`}
      >
        <span className="text-lg">📣</span>
        <span>Announcements</span>
      </Link>
    </>
  ) : (
    <Link
      to="/signin"
      onClick={handleLinkClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
        isActive('/signin') ? 'bg-secondary-400 text-primary-800 shadow-md' : 'text-primary-50 hover:bg-primary-600/50'
      }`}
    >
      <span className="text-lg">🔑</span>
      <span>Sign In</span>
    </Link>
  )

  return (
    <aside
      className={`bg-gradient-hero-alt text-white w-72 max-w-[86vw] h-[calc(100vh-0px)] flex flex-col fixed left-0 top-0 z-30 shadow-2xl border-r-4 border-secondary-500 transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >

      <div className="px-5 py-6 bg-primary-900/40 border-b-2 border-secondary-400 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <img src="/logo.png" alt="KAG Unity Church" className="w-10 h-10 rounded-lg object-cover bg-white shadow-lg" />
          <div>
            <div className="text-base font-display font-bold">KAG Unity</div>
            <div className="text-xs text-primary-200">Church App</div>
          </div>
        </div>
      </div>

      <nav className="px-3 py-6 flex-1 overflow-y-auto">
        <div className="text-xs font-semibold text-primary-200 px-3 mb-3 uppercase tracking-wide flex items-center gap-2">
          <span>📋</span>
          <span>Main Menu</span>
        </div>
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={handleLinkClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition mb-1 ${
              isActive(item.to)
                ? 'bg-secondary-400 text-primary-800 shadow-md'
                : 'text-primary-50 hover:bg-primary-600/50'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}

        {authLinks && (
          <>
            <div className="mt-6 pt-6 border-t border-primary-500">
              <div className="text-xs font-semibold text-primary-200 px-3 mb-3 uppercase tracking-wide flex items-center gap-2">
                <span>🔐</span>
                <span>Account</span>
              </div>
              <Link
                to="/profile"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg bg-primary-900/30 hover:bg-primary-900/50 transition"
              >
                <Avatar src={currentUser?.avatarSrc} name={currentUser?.name} size={40} className="ring-2 ring-secondary-400/60" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{currentUser?.name || 'My Account'}</div>
                  <div className="text-xs text-primary-200 truncate">{currentUser?.role || 'Member'}</div>
                </div>
              </Link>
              {authLinks}
            </div>
          </>
        )}
      </nav>

      {hasToken && (
        <div className="px-3 py-4 border-t-2 border-secondary-400/60 bg-primary-900/40 shrink-0">
          <button
            type="button"
            onClick={() => {
              signOut()
              window.location.href = '/signin'
            }}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition bg-secondary-400 text-primary-900 hover:bg-secondary-300 shadow-md"
          >
            <span className="text-lg">🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  )
}