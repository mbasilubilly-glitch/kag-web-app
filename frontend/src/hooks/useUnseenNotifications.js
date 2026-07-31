import { useEffect, useState } from 'react'
import api, { getAuthToken } from '../api'

const LAST_SEEN_KEY = 'notificationsLastSeenAt'

// The backend has no per-user read/unread flag on Notification (some rows
// are broadcasts shared by every user, so a plain boolean on the row
// wouldn't even make sense) - this approximates "unseen" client-side by
// comparing the newest notification's timestamp against the last time this
// browser visited the Notifications page. Good enough for a nav badge;
// not a substitute for real per-user read receipts if that's ever needed.
export function markNotificationsSeen(latestCreatedAt) {
  if (latestCreatedAt) localStorage.setItem(LAST_SEEN_KEY, latestCreatedAt)
}

export default function useUnseenNotifications() {
  const [hasUnseen, setHasUnseen] = useState(false)

  useEffect(() => {
    let mounted = true

    const check = () => {
      if (!getAuthToken()) return
      api.get('/notifications/')
        .then((res) => {
          if (!mounted) return
          const items = res.data || []
          const newest = items[0]?.created_at
          const lastSeen = localStorage.getItem(LAST_SEEN_KEY)
          setHasUnseen(Boolean(newest && (!lastSeen || new Date(newest) > new Date(lastSeen))))
        })
        .catch(() => {})
    }

    check()
    const interval = setInterval(check, 60000)
    window.addEventListener('authChanged', check)

    return () => {
      mounted = false
      clearInterval(interval)
      window.removeEventListener('authChanged', check)
    }
  }, [])

  return hasUnseen
}
