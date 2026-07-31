import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import { downloadIcsFile } from '../utils/ics'
import { extractErrorMessage as readableError } from '../utils/errors'

const PLATFORM_LABELS = {
  google_meet: 'Google Meet',
  zoom: 'Zoom',
  teams: 'Microsoft Teams',
  built_in: 'Built-in Video Meeting',
}

function formatCountdown(ms) {
  if (ms <= 0) return null
  const totalMinutes = Math.floor(ms / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `Starts in ${days}d ${hours}h`
  if (hours > 0) return `Starts in ${hours}h ${minutes}m`
  return `Starts in ${minutes}m`
}

function StatusBadge({ status }) {
  const styles = {
    Live: 'bg-green-100 text-green-800',
    Upcoming: 'bg-blue-100 text-blue-800',
    Ended: 'bg-slate-100 text-slate-600',
    Cancelled: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || styles.Upcoming}`}>
      {status === 'Live' ? 'Live Now 🟢' : status}
    </span>
  )
}

export default function OnlineMeetingsCard({ ministryId }) {
  const navigate = useNavigate()
  const [meetings, setMeetings] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)
  const [now, setNow] = useState(Date.now())

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get(`/online-meetings/?ministry=${ministryId}&status=upcoming`),
      api.get('/online-meetings/my-attendance/'),
    ])
      .then(([meetingsRes, statsRes]) => {
        setMeetings(meetingsRes.data || [])
        setStats(statsRes.data || null)
        setError('')
      })
      .catch(() => setError('Unable to load online sessions.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ministryId])

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(tick)
  }, [])

  if (loading) {
    return <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 text-slate-500">Loading online sessions…</div>
  }
  if (error) {
    return <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 text-red-600">{error}</div>
  }

  const next = meetings[0]
  const upcoming = meetings.slice(1, 4)

  const joinMeeting = async (meeting) => {
    // Built-in sessions join inline (mic/camera/screen-share controls) on
    // the detail page - a full video call doesn't belong inside this small
    // dashboard card. External platforms still open in their own tab.
    if (meeting.meeting_platform === 'built_in') {
      navigate(`/online-meetings/${meeting.id}`)
      return
    }
    setJoining(true)
    setError('')
    try {
      const res = await api.post(`/online-meetings/${meeting.id}/join/`)
      window.open(res.data.meeting_link, '_blank', 'noopener')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to join this session.'))
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 space-y-6">
      <h2 className="text-lg font-semibold">📹 Online Meetings</h2>

      {!next && (
        <div className="text-slate-500 text-sm">No upcoming online sessions scheduled yet.</div>
      )}

      {next && (
        <div className="rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{next.title}</h3>
            <StatusBadge status={next.status} />
          </div>
          <div className="text-sm text-slate-600 space-y-1">
            {next.speaker && <div>Host: {next.speaker}</div>}
            <div>Date: {new Date(next.meeting_date).toLocaleDateString()}</div>
            <div>Time: {next.start_time} - {next.end_time}</div>
            <div>Platform: {PLATFORM_LABELS[next.meeting_platform] || next.meeting_platform}</div>
            {next.status === 'Upcoming' && (
              <div className="font-medium text-primary-700">
                {formatCountdown(new Date(`${next.meeting_date}T${next.start_time}`) - now)}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              disabled={!next.is_joinable || joining}
              onClick={() => joinMeeting(next)}
              className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              {joining ? 'Joining…' : 'Join Meeting'}
            </button>
            <button
              type="button"
              onClick={() => downloadIcsFile(next)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Add to Calendar
            </button>
            <Link
              to={`/online-meetings/${next.id}`}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              View Details
            </Link>
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-500">Upcoming Meetings</h4>
          {upcoming.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2 text-sm">
              <div>
                <div className="font-medium">{m.title}</div>
                <div className="text-slate-500 text-xs">{new Date(m.meeting_date).toLocaleDateString()} • {m.start_time}</div>
              </div>
              <Link to={`/online-meetings/${m.id}`} className="text-primary-700 font-semibold text-xs">
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="text-center">
            <div className="text-xl font-bold">{meetings.length}</div>
            <div className="text-xs text-slate-500">📅 Upcoming</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{stats.attended}</div>
            <div className="text-xs text-slate-500">✅ Attended</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{stats.attendance_rate}%</div>
            <div className="text-xs text-slate-500">📈 Attendance Rate</div>
          </div>
        </div>
      )}
    </div>
  )
}
