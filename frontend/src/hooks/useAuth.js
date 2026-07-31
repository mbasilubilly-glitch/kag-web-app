import { useEffect, useState } from 'react'
import api, { getAuthToken, clearAuthToken } from '../api'

function readAuthFlags() {
  return {
    isAuthenticated: Boolean(getAuthToken()),
    isAdmin: localStorage.getItem('isAdmin') === 'true',
    isSuperAdmin: localStorage.getItem('isSuperAdmin') === 'true',
    isMediaTeam: localStorage.getItem('isMediaTeam') === 'true',
    role: localStorage.getItem('userRole') || null,
  }
}

// Single source of truth for the auth/role flags set at sign-in
// (SignIn.jsx's applySession) and read all over the app. Re-derives on the
// shared 'authChanged' event so every consumer stays in sync without its
// own useState + event-listener pair.
export default function useAuth() {
  const [flags, setFlags] = useState(readAuthFlags)

  useEffect(() => {
    const sync = () => setFlags(readAuthFlags())
    window.addEventListener('authChanged', sync)
    return () => window.removeEventListener('authChanged', sync)
  }, [])

  const signOut = () => {
    // Best-effort: invalidate the token server-side too, not just this
    // browser's copy of it - but never let a slow/failed network request
    // block the user from leaving this device right now.
    if (getAuthToken()) {
      api.post('/auth/logout/').catch(() => {})
    }
    clearAuthToken()
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('isSuperAdmin')
    localStorage.removeItem('isMediaTeam')
    localStorage.removeItem('userRole')
    window.dispatchEvent(new Event('authChanged'))
  }

  return { ...flags, signOut }
}
