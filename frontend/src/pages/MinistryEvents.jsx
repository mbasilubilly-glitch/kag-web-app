import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'
import MinistryGuard from '../components/MinistryGuard'
import MinistryConsoleNav from '../components/MinistryConsoleNav'
import { extractErrorMessage as readableError } from '../utils/errors'

export default function MinistryEvents() {
  const { id } = useParams()
  const [ministry, setMinistry] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', date: '', venue: '' })

  const loadEvents = () => api.get(`/events/?ministry=${id}`).then((res) => setEvents(res.data))

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')
    Promise.all([api.get(`/ministries/${id}/`), loadEvents()])
      .then(([ministryRes]) => { if (mounted) setMinistry(ministryRes.data) })
      .catch(() => { if (mounted) setError('Unable to load events.') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const createEvent = async (e) => {
    e.preventDefault()
    setError('')
    setCreating(true)
    try {
      await api.post('/events/', { ...form, ministry: Number(id) })
      setForm({ title: '', description: '', date: '', venue: '' })
      await loadEvents()
    } catch (err) {
      setError(readableError(err, 'Unable to create event.'))
    } finally {
      setCreating(false)
    }
  }

  const deleteEvent = async (eventId) => {
    if (!confirm('Delete this event?')) return
    try {
      await api.delete(`/events/${eventId}/`)
      await loadEvents()
    } catch (err) {
      setError(readableError(err, 'Unable to delete event.'))
    }
  }

  return (
    <MinistryGuard ministryId={id}>
      <div className="container py-10">
        <MinistryConsoleNav ministryId={id} ministryName={ministry?.ministry_name} />

        {error && <div className="p-4 bg-red-100 text-red-800 rounded mb-4">{error}</div>}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold mb-4">New Event</h2>
            <form onSubmit={createEvent} className="space-y-3">
              <input
                type="text" placeholder="Title" required
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Description" required
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                rows={3}
              />
              <input
                type="datetime-local" required
                value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="text" placeholder="Venue" required
                value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <button type="submit" disabled={creating} className="w-full rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60">
                {creating ? 'Creating…' : 'Create Event'}
              </button>
            </form>
          </div>

          <div className="md:col-span-2 rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold mb-4">Department Events</h2>
            {loading && <div className="text-slate-600">Loading…</div>}
            {!loading && events.length === 0 && <div className="text-slate-600">No events for this department yet.</div>}
            <div className="space-y-3">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <div>
                    <div className="font-medium">{ev.title}</div>
                    <div className="text-slate-500 text-xs">{new Date(ev.date).toLocaleString()} · {ev.venue}</div>
                  </div>
                  <button onClick={() => deleteEvent(ev.id)} className="rounded-lg border border-red-300 text-red-600 px-3 py-1.5 text-xs font-semibold">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MinistryGuard>
  )
}
