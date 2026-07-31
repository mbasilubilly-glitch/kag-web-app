import { useEffect, useState } from 'react'
import api from '../api'
import { BarTrendChart, LineTrendChart } from './charts/ExecutiveCharts'

const STAT_CARDS = [
  { key: 'attendance_count', label: 'My Attendance', icon: '🙋' },
  { key: 'events_registered', label: 'Events Registered', icon: '📅' },
  { key: 'prayer_requests', label: 'My Prayer Requests', icon: '🙏' },
]

function formatStatValue(value) {
  if (value === undefined || value === null) return '—'
  return value.toLocaleString()
}

function StatTile({ label, icon, value, loading }) {
  return (
    <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-md border border-gray-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      {loading ? (
        <div className="h-8 w-20 rounded bg-gray-100 dark:bg-slate-700/50 animate-pulse" />
      ) : (
        <p className="text-2xl font-display font-bold text-primary-800 dark:text-primary-300">
          {formatStatValue(value)}
        </p>
      )}
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6">
      <h3 className="font-display text-lg font-bold text-primary-800 dark:text-primary-300 mb-4">{title}</h3>
      {children}
    </div>
  )
}

// Personal activity for Members and Visitors alike - same charts, same
// endpoint (scoped server-side to request.user), works whether or not the
// signed-in user has any attendance/event history yet.
export default function MyActivityDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/my-activity-summary/')
      .then((res) => setData(res.data))
      .catch(() => setError('Unable to load your activity right now.'))
      .finally(() => setLoading(false))
  }, [])

  const stats = data?.stats
  const charts = data?.charts

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-primary-800 dark:text-primary-300 mb-1">My Activity</h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">Your attendance and event history over the last 6 months.</p>
      </div>

      {error && (
        <div className="rounded-2xl bg-danger-50 dark:bg-red-950/40 border border-danger-200 dark:border-red-900 p-4 text-sm text-danger-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {STAT_CARDS.map((card) => (
          <StatTile
            key={card.key}
            label={card.label}
            icon={card.icon}
            value={stats?.[card.key]}
            loading={loading}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="My Attendance">
          <BarTrendChart data={charts?.attendance_trend} loading={loading} />
        </ChartCard>
        <ChartCard title="My Event Registrations">
          <LineTrendChart data={charts?.events_trend} loading={loading} />
        </ChartCard>
      </div>
    </div>
  )
}
