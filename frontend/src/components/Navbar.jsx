import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useCurrentUser from '../hooks/useCurrentUser'
import Avatar from './Avatar'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  // Navbar kept for branding only. Full navigation is in Sidebar.
  const { isAuthenticated, signOut } = useAuth()
  const currentUser = useCurrentUser()

  const handleSignOut = () => {
    signOut()
    window.location.href = '/signin'
  }

  return (
    <header className="bg-gradient-hero shadow-lg sticky top-0 z-20 border-b-4 border-secondary-500">
      <div className="container flex items-center justify-between py-4 px-4">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="KAG Unity Church"
            className="w-10 h-10 rounded-full object-cover bg-white shadow-md group-hover:shadow-lg transition"
          />
          <span className="text-xl font-display font-bold text-white hidden sm:inline group-hover:text-secondary-200 transition">
            KAG Unity Church
          </span>
        </Link>

        {/* Navigation features live in Sidebar; Navbar kept for branding only. */}
        <div className="flex items-center gap-4 text-sm">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="flex items-center gap-2 group">
                <Avatar src={currentUser?.avatarSrc} name={currentUser?.name} size={36} className="ring-2 ring-white/30 group-hover:ring-white/60 transition" />
                <span className="text-white font-semibold hidden lg:inline group-hover:text-secondary-200 transition">
                  {currentUser?.name || 'My Profile'}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-4 py-2 rounded-lg bg-secondary-400 text-primary-700 font-semibold hover:bg-secondary-300 transition shadow-md"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/signin" className="px-4 py-2 rounded-lg bg-white text-primary-700 font-semibold hover:bg-secondary-100 transition shadow-md">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

