import { useEffect, useState } from 'react'
import api from '../api'
import {
  BarTrendChart,
  ConversionFunnelChart,
  DistributionPieChart,
  HorizontalBarChart,
  LineTrendChart,
  StatusBarChart,
} from './charts/ExecutiveCharts'

const STAT_CARDS = [
  { key: 'total_members', label: 'Total Members', icon: '👥' },
  { key: 'active_members', label: 'Active Members', icon: '✅' },
  { key: 'visitors', label: 'Visitors', icon: '👋' },
  { key: 'attendance_today', label: 'Attendance Today', icon: '🙋' },
  { key: 'upcoming_events', label: 'Upcoming Events', icon: '📅' },
  { key: 'prayer_requests', label: 'Prayer Requests', icon: '🙏' },
  { key: 'ministries', label: 'Ministries', icon: '🤝' },
  { key: 'homecell_fellowships', label: 'Homecell Fellowships', icon: '🏠' },
  { key: 'baptized_members', label: 'Baptized Members', icon: '💧' },
  { key: 'pending_registrations', label: 'Pending Registrations', icon: '⏳' },
  { key: 'pending_ministry_requests', label: 'Pending Ministry Requests', icon: '📥' },
]

// Prayer status bars draw from the reserved status scale, not the
// categorical palette - Answered is "good", Pending is "warning", In
// Progress is neutral/active (brand blue).
const PRAYER_STATUS_MAP = { Answered: 'good', Pending: 'warning', 'In Progress': 'neutral' }

function formatStatValue(value) {
  if (value === undefined || value === null) return '—'
  return value.toLocaleString()
}

function StatCard({ label, icon, value, loading }) {
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

export default function ExecutiveDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/analytics/executive-summary/')
      .then((res) => setData(res.data))
      .catch(() => setError('Unable to load the executive dashboard right now.'))
      .finally(() => setLoading(false))
  }, [])

  const stats = data?.stats
  const charts = data?.charts

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-primary-800 dark:text-primary-300 mb-1">Church Executive Dashboard</h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">A church-wide view of growth and engagement at a glance.</p>
      </div>

      {error && (
        <div className="rounded-2xl bg-danger-50 dark:bg-red-950/40 border border-danger-200 dark:border-red-900 p-4 text-sm text-danger-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Headline stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {STAT_CARDS.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            icon={card.icon}
            value={stats?.[card.key]}
            loading={loading}
          />
        ))}
      </div>

      {/* Row 1: Church Growth (line) + Visitor Conversion (funnel) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Church Growth">
          <LineTrendChart data={charts?.church_growth} loading={loading} />
        </ChartCard>
        <ChartCard title="Visitor Conversion">
          <ConversionFunnelChart data={charts?.visitor_conversion} loading={loading} />
        </ChartCard>
      </div>

      {/* Row 2: Attendance Analytics (bar) + Member Distribution (pie) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Attendance Analytics">
          <BarTrendChart data={charts?.attendance_analytics} loading={loading} />
        </ChartCard>
        <ChartCard title="Member Distribution">
          <DistributionPieChart data={charts?.member_distribution} loading={loading} />
        </ChartCard>
      </div>

      {/* Row 3: Ministry Performance (horizontal bar) + Homecell Growth (bar) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Ministry Performance">
          <HorizontalBarChart data={charts?.ministry_performance} loading={loading} />
        </ChartCard>
        <ChartCard title="Homecell Growth">
          <BarTrendChart data={charts?.homecell_growth} loading={loading} />
        </ChartCard>
      </div>

      {/* Row 4: Prayer Statistics (bar) + Event Registration (line) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Prayer Statistics">
          <StatusBarChart data={charts?.prayer_statistics} statusMap={PRAYER_STATUS_MAP} loading={loading} />
        </ChartCard>
        <ChartCard title="Event Registration">
          <LineTrendChart data={charts?.event_registration} loading={loading} />
        </ChartCard>
      </div>
    </div>
  )
}
