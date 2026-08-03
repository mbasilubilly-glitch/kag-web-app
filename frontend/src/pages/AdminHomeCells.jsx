import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { extractErrorMessage } from '../utils/errors'

const MEETING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MIN_REQUIRED_ADMINS = 4

const EMPTY_FORM = {
  ministry_name: '', description: '', meeting_day: '', meeting_time: '', meeting_venue: '',
  area_location: '', county: '', max_capacity: '',
}

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-200 text-slate-700',
  archived: 'bg-amber-100 text-amber-800',
}

function readableError(err, fallback) {
  return extractErrorMessage(err, fallback, { fields: ['ministry_name'] })
}

export default function AdminHomeCells() {
  const [homecells, setHomecells] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [form, setForm] = useState(EMPTY_FORM)
  const [creating, setCreating] = useState(false)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    api.get(`/admin/homecells/?${params.toString()}`)
      .then((res) => setHomecells(res.data || []))
      .catch((err) => setError(readableError(err, 'Unable to load Home Cell Fellowships.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, statusFilter])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setCreating(true)
    try {
      const payload = { ...form, max_capacity: form.max_capacity || null, meeting_time: form.meeting_time || null }
      await api.post('/admin/homecells/', payload)
      setForm(EMPTY_FORM)
      setNotice('Home Cell Fellowship created.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to create Home Cell Fellowship.'))
    } finally {
      setCreating(false)
    }
  }

  const toggleArchive = async (h) => {
    setError('')
    try {
      await api.post(`/admin/homecells/${h.id}/archive/`, { action: h.status === 'archived' ? 'restore' : 'archive' })
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to update status.'))
    }
  }

  const removeHomecell = async (id) => {
    if (!confirm('Move this Home Cell Fellowship to the recycle bin? You can restore it later, or delete it permanently from there.')) return
    setError('')
    try {
      await api.delete(`/admin/homecells/${id}/`)
      setNotice('Home Cell Fellowship moved to the recycle bin.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to delete Home Cell Fellowship.'))
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Home Cell Fellowships</h1>
          <p className="text-slate-600 mt-2">
            Unlimited Home Cell Fellowships, grouped by area or fellowship group. Assign leaders,
            register members, and track attendance from each cell's console.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/homecells/dashboard" className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold">Dashboard</Link>
          <Link to="/admin/homecells/recycle-bin" className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold">Recycle Bin</Link>
        </div>
      </div>

      {error && <div className="rounded-3xl bg-red-100 p-6 text-red-800">{error}</div>}
      {notice && <div className="rounded-3xl bg-green-100 p-6 text-green-800">{notice}</div>}

      <form onSubmit={handleCreate} className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-xl font-semibold">Create Home Cell Fellowship</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <label>
            <span className="text-slate-700 text-sm">Name</span>
            <input required value={form.ministry_name} onChange={(e) => setForm({ ...form, ministry_name: e.target.value })} placeholder="e.g. Jerusalem" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Description</span>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Meeting Day</span>
            <select value={form.meeting_day} onChange={(e) => setForm({ ...form, meeting_day: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3">
              <option value="">Select…</option>
              {MEETING_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label>
            <span className="text-slate-700 text-sm">Meeting Time</span>
            <input type="time" value={form.meeting_time} onChange={(e) => setForm({ ...form, meeting_time: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Meeting Venue</span>
            <input value={form.meeting_venue} onChange={(e) => setForm({ ...form, meeting_venue: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Area/Location</span>
            <input value={form.area_location} onChange={(e) => setForm({ ...form, area_location: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">County</span>
            <input value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Maximum Capacity</span>
            <input type="number" min="0" value={form.max_capacity} onChange={(e) => setForm({ ...form, max_capacity: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
        </div>
        <p className="text-xs text-slate-500">Physical address, church branch, and contact details can be added afterwards from the cell's "Manage" page.</p>
        <button disabled={creating} type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60">
          {creating ? 'Creating…' : 'Create Home Cell Fellowship'}
        </button>
      </form>

      <div className="rounded-3xl bg-white p-6 shadow-sm border flex flex-wrap items-center gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, area, or county…" className="rounded-xl border border-slate-300 px-3 py-2 text-sm flex-1 min-w-[200px]" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-slate-500">Loading…</div>
        ) : homecells.length === 0 ? (
          <div className="rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 p-10 text-center">
            {search || statusFilter ? (
              <p className="text-slate-500 text-sm">No Home Cell Fellowships match this search/filter.</p>
            ) : (
              <>
                <div className="text-4xl mb-3">🏠</div>
                <p className="text-slate-700 font-semibold">No Home Cell Fellowships yet</p>
                <p className="text-slate-500 text-sm mt-1">Use the form above to create your first one.</p>
              </>
            )}
          </div>
        ) : (
          homecells.map((h) => (
            <div key={h.id} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold">{h.ministry_name}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[h.status] || 'bg-slate-100 text-slate-800'}`}>{h.status}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${h.admin_count >= MIN_REQUIRED_ADMINS ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {h.admin_count >= MIN_REQUIRED_ADMINS ? '✓' : '⚠️'} {h.admin_count} admin{h.admin_count === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm">
                    {h.meeting_day || 'No meeting day set'}{h.meeting_time ? ` · ${h.meeting_time}` : ''} · {h.meeting_venue || 'No venue set'} · {h.area_location || h.county || 'No location set'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/admin/homecells/${h.id}`} className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold">Manage</Link>
                  <Link to={`/homecells/${h.id}/dashboard`} className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold">Open Console</Link>
                  <button onClick={() => toggleArchive(h)} className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold">
                    {h.status === 'archived' ? 'Restore' : 'Archive'}
                  </button>
                  <button onClick={() => removeHomecell(h.id)} className="rounded-full bg-red-500/15 text-red-700 px-4 py-1.5 text-sm font-semibold hover:bg-red-500/25">Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
