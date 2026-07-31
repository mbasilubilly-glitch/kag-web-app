import { useEffect, useState } from 'react'
import api, { getAuthToken } from '../api'

// Shared by Navbar/Sidebar/Dashboard so the signed-in user's name + avatar
// only need one fetch. Module-level cache + subscriber list (not just a
// shared function body) so all three mount at once without each firing its
// own independent /auth/profile/ request and racing to update its own
// local state - previously each component's useCurrentUser() call started
// from null and fetched independently, so whichever one's fetch happened to
// still be in flight (or lost the race after a dev StrictMode remount) kept
// rendering the null/loading fallback even after the others had resolved.
let cachedUser = null
let inFlight = null
const subscribers = new Set()

function notify(user) {
  cachedUser = user
  subscribers.forEach((set) => set(user))
}

function load() {
  if (!getAuthToken()) {
    notify(null)
    return
  }
  if (!inFlight) {
    inFlight = api.get('/auth/profile/')
      .then((res) => {
        const data = res.data
        const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || data.username
        // The Super Administrator is a distinct concept from a regular
        // Church Administrator (both use profile.role='Administrator'
        // under the hood - see ROLES_AND_FEATURES.md §0) - shown here via
        // the is_staff+is_superuser flags rather than the raw role value.
        const isSuperAdmin = Boolean(data.is_staff && data.is_superuser)
        notify({
          name,
          role: isSuperAdmin ? 'Super Admin' : (data.profile?.role || 'Visitor'),
          avatarSrc: data.profile?.profile_picture || data.profile?.profile_image || null,
        })
      })
      .catch(() => notify(null))
      .finally(() => { inFlight = null })
  }
  return inFlight
}

export default function useCurrentUser() {
  const [user, setUser] = useState(cachedUser)

  useEffect(() => {
    subscribers.add(setUser)
    load()
    window.addEventListener('authChanged', load)
    return () => {
      subscribers.delete(setUser)
      window.removeEventListener('authChanged', load)
    }
  }, [])

  return user
}
