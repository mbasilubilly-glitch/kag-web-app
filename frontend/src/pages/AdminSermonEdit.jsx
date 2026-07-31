import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'

export default function AdminSermonEdit({ basePath = '/admin/sermons' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', speaker: '', category: '', video_url: '', audio_url: '', notes_url: '', summary: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      api.get(`/sermons/${id}/`)
        .then((res) => setForm((prev) => ({
          ...prev,
          ...Object.fromEntries(Object.entries(res.data).map(([k, v]) => [k, v ?? ''])),
        })))
        .catch(() => setError('Unable to load sermon'))
    }
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (id) {
        await api.put(`/sermons/${id}/`, form)
      } else {
        await api.post(`/sermons/`, form)
      }
      navigate(basePath)
    } catch (err) {
      // Show backend validation errors so admins can fix issues quickly.
      const data = err?.response?.data
      const detail = data?.detail || data?.message || data
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail))
    }
  }


  return (
    <div className="container py-10">
      <div className="rounded-3xl bg-white p-6 shadow-sm mb-6">
        <h1 className="text-2xl font-bold">{id ? 'Edit Sermon' : 'New Sermon'}</h1>
      </div>
      {error && <div className="p-4 bg-red-100 text-red-800 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="grid gap-4 max-w-3xl">
        <label>
          <span className="text-slate-700">Title</span>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="mt-2 w-full rounded-2xl border px-4 py-3" />
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          <label>
            <span className="text-slate-700">Speaker</span>
            <input value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })} className="mt-2 w-full rounded-2xl border px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700">Category</span>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-2 w-full rounded-2xl border px-4 py-3" />
          </label>
        </div>
        <label>
          <span className="text-slate-700">Video URL</span>
          <input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} className="mt-2 w-full rounded-2xl border px-4 py-3" />
        </label>
        <label>
          <span className="text-slate-700">Audio URL</span>
          <input value={form.audio_url} onChange={(e) => setForm({ ...form, audio_url: e.target.value })} className="mt-2 w-full rounded-2xl border px-4 py-3" />
        </label>
        <label>
          <span className="text-slate-700">Notes URL</span>
          <input value={form.notes_url} onChange={(e) => setForm({ ...form, notes_url: e.target.value })} className="mt-2 w-full rounded-2xl border px-4 py-3" />
        </label>
        <label>
          <span className="text-slate-700">Summary</span>
          <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="mt-2 w-full rounded-2xl border px-4 py-3" rows={6} />
        </label>
        <div className="flex gap-3">
          <button type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3">Save</button>
          <button type="button" onClick={() => navigate(basePath)} className="rounded-2xl border px-6 py-3">Cancel</button>
        </div>
      </form>
    </div>
  )
}
