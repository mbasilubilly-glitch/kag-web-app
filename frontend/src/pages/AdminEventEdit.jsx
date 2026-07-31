import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'

export default function AdminEventEdit({ basePath = '/admin/events' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', date: '', venue: '', image: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      api.get(`/events/${id}/`).then((res) => {
        // date from API is ISO - convert to local datetime-local input value
        const d = res.data.date
        setForm((prev) => ({
          ...prev,
          ...Object.fromEntries(Object.entries(res.data).map(([k, v]) => [k, v ?? ''])),
          date: d ? new Date(d).toISOString().slice(0,16) : '',
        }))
      }).catch(() => setError('Unable to load event'))
    }
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form }
      // convert datetime-local back to ISO
      if (payload.date) payload.date = new Date(payload.date).toISOString()
      if (id) {
        await api.put(`/events/${id}/`, payload)
      } else {
        await api.post(`/events/`, payload)
      }
      navigate(basePath)
    } catch (err) {
      setError('Save failed')
    }
  }

  return (
    <div className="container py-10">
      <div className="rounded-3xl bg-white p-6 shadow-sm mb-6">
        <h1 className="text-2xl font-bold">{id ? 'Edit Event' : 'New Event'}</h1>
      </div>
      {error && <div className="p-4 bg-red-100 text-red-800 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="grid gap-4 max-w-3xl">
        <label>
          <span className="text-slate-700">Title</span>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="mt-2 w-full rounded-2xl border px-4 py-3" />
        </label>
        <label>
          <span className="text-slate-700">Description</span>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-2 w-full rounded-2xl border px-4 py-3" rows={5} />
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          <label>
            <span className="text-slate-700">Date & Time</span>
            <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="mt-2 w-full rounded-2xl border px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700">Venue</span>
            <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="mt-2 w-full rounded-2xl border px-4 py-3" />
          </label>
        </div>
        <label>
          <span className="text-slate-700">Image URL</span>
          <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="mt-2 w-full rounded-2xl border px-4 py-3" />
        </label>
        <div className="flex gap-3">
          <button type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3">Save</button>
          <button type="button" onClick={() => navigate(basePath)} className="rounded-2xl border px-6 py-3">Cancel</button>
        </div>
      </form>
    </div>
  )
}
