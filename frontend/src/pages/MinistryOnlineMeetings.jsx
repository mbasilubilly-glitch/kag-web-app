import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api'
import MinistryGuard from '../components/MinistryGuard'
import MinistryConsoleNav from '../components/MinistryConsoleNav'
import { extractErrorMessage as readableError } from '../utils/errors'

const PLATFORM_OPTIONS = [
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'built_in', label: 'Built-in Video Meeting' },
]

const EMPTY_FORM = {
  title: '', description: '', speaker: '', theme: '', scripture_reference: '',
  meeting_link: '', meeting_platform: 'google_meet',
  meeting_date: '', start_time: '', end_time: '',
}

export default function MinistryOnlineMeetings() {
  const { id } = useParams()
  const [ministry, setMinistry] = useState(null)
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const loadMeetings = () => api.get(`/online-meetings/?ministry=${id}`).then((res) => setMeetings(res.data || []))

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')
    Promise.all([api.get(`/ministries/${id}/`), loadMeetings()])
      .then(([ministryRes]) => { if (mounted) setMinistry(ministryRes.data) })
      .catch(() => { if (mounted) setError('Unable to load online sessions.') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const createMeeting = async (e) => {
    e.preventDefault()
    setError('')
    setCreating(true)
    try {
      let meetingLink = form.meeting_link
      if (form.meeting_platform === 'built_in' && !meetingLink) {
        const slug = form.title.replace(/[^a-z0-9]+/gi, '') || Date.now().toString()
        meetingLink = `https://meet.jit.si/KAGUnity-${slug}`
      }
      await api.post('/online-meetings/', { ...form, meeting_link: meetingLink, ministry: Number(id) })
      setForm(EMPTY_FORM)
      await loadMeetings()
    } catch (err) {
      setError(readableError(err, 'Unable to create session.'))
    } finally {
      setCreating(false)
    }
  }

  const cancelMeeting = async (meetingId) => {
    if (!confirm('Cancel this session?')) return
    try {
      await api.patch(`/online-meetings/${meetingId}/`, { is_cancelled: true })
      await loadMeetings()
    } catch (err) {
      setError(readableError(err, 'Unable to cancel session.'))
    }
  }

  const setRecordingUrl = async (meetingId) => {
    const url = prompt('Recording URL:')
    if (!url) return
    try {
      await api.patch(`/online-meetings/${meetingId}/`, { recording_url: url })
      await loadMeetings()
    } catch (err) {
      setError(readableError(err, 'Unable to set recording URL.'))
    }
  }

  const deleteMeeting = async (meetingId) => {
    if (!confirm('Delete this session permanently?')) return
    try {
      await api.delete(`/online-meetings/${meetingId}/`)
      await loadMeetings()
    } catch (err) {
      setError(readableError(err, 'Unable to delete session.'))
    }
  }

  return (
    <MinistryGuard ministryId={id}>
      <div className="container py-10">
        <MinistryConsoleNav ministryId={id} ministryName={ministry?.ministry_name} />

        {error && <div className="p-4 bg-red-100 text-red-800 rounded mb-4">{error}</div>}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold mb-4">New Online Session</h2>
            <form onSubmit={createMeeting} className="space-y-3">
              <input type="text" placeholder="Title" required
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <textarea placeholder="Description / Agenda"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" rows={3} />
              <input type="text" placeholder="Speaker / Host"
                value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <input type="text" placeholder="Theme"
                value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <input type="text" placeholder="Scripture Reference"
                value={form.scripture_reference} onChange={(e) => setForm({ ...form, scripture_reference: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <input
                type="url"
                placeholder={form.meeting_platform === 'built_in' ? 'Meeting Link (auto-generated if left blank)' : 'Meeting Link'}
                required={form.meeting_platform !== 'built_in'}
                value={form.meeting_link} onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <select
                value={form.meeting_platform} onChange={(e) => setForm({ ...form, meeting_platform: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                {PLATFORM_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <input type="date" required
                value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <input type="time" required
                  value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="w-1/2 rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                <input type="time" required
                  value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="w-1/2 rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <button type="submit" disabled={creating} className="w-full rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60">
                {creating ? 'Creating…' : 'Create Session'}
              </button>
            </form>
          </div>

          <div className="md:col-span-2 rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold mb-4">Online Sessions</h2>
            {loading && <div className="text-slate-600">Loading…</div>}
            {!loading && meetings.length === 0 && <div className="text-slate-600">No online sessions yet.</div>}
            <div className="space-y-3">
              {meetings.map((m) => (
                <div key={m.id} className="rounded-xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <Link to={`/online-meetings/${m.id}`} className="font-medium hover:underline">{m.title}</Link>
                      <div className="text-slate-500 text-xs">
                        {new Date(m.meeting_date).toLocaleDateString()} · {m.start_time}-{m.end_time} · {m.status}
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs font-semibold">
                      {m.status === 'Ended' && (
                        <button onClick={() => setRecordingUrl(m.id)} className="rounded-lg border border-slate-300 px-3 py-1.5">
                          {m.recording_url ? 'Update Recording' : 'Add Recording'}
                        </button>
                      )}
                      {(m.status === 'Upcoming' || m.status === 'Live') && (
                        <button onClick={() => cancelMeeting(m.id)} className="rounded-lg border border-amber-300 text-amber-700 px-3 py-1.5">
                          Cancel
                        </button>
                      )}
                      <button onClick={() => deleteMeeting(m.id)} className="rounded-lg border border-red-300 text-red-600 px-3 py-1.5">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MinistryGuard>
  )
}
