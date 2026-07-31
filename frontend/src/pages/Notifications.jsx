import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { markNotificationsSeen } from '../hooks/useUnseenNotifications'
import MyConsoleNav from '../components/MyConsoleNav'

export default function Notifications() {

  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const unreadCount = useMemo(() => {
    // Backend model has `is_sent` but no read/unread field. Treat all as "new" for now.
    // You can extend backend later with `read_at` / `is_read`.
    return items.length
  }, [items])

  useEffect(() => {
    let mounted = true

    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications/')
        if (!mounted) return
        const data = res.data || []
        setItems(data)
        setError('')
        markNotificationsSeen(data[0]?.created_at)
      } catch (e) {
        if (!mounted) return
        setError('Unable to load notifications')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    fetchNotifications()

    // Polling for in-app notifications (no push secrets required)
    const interval = setInterval(fetchNotifications, 60000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="container py-10 space-y-6">
      <MyConsoleNav />

      <div className="rounded-3xl bg-white p-8 shadow-sm flex items-center justify-between gap-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <div className="rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-semibold">
          {loading ? '...' : `${unreadCount} items`}
        </div>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link to="/notifications/enable" className="rounded-2xl bg-slate-900 text-white px-5 py-3 font-semibold">
          Enable Push Notifications
        </Link>
        <div className="text-xs text-slate-500">Push requires browser permission.</div>
      </div>


      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-3xl bg-slate-100 p-10 text-center text-slate-600">Loading…</div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl bg-slate-100 p-10 text-center text-slate-600">No notifications yet.</div>
        ) : (
          items.map((n) => (
            <div key={n.id} className="rounded-2xl bg-white p-5 border shadow-sm">
              <div className="font-semibold text-slate-900">{n.title}</div>
              <div className="text-sm text-slate-600 mt-1">{n.message}</div>
              {n.created_at && (
                <div className="text-xs text-slate-400 mt-2">{new Date(n.created_at).toLocaleString()}</div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  )
}

