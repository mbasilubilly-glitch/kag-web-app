import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { extractErrorMessage } from '../utils/errors'

const EMPTY_FORM = { name: '', description: '' }

function readableError(err, fallback) {
  return extractErrorMessage(err, fallback, { fields: ['name'] })
}

export default function AdminGalleryCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/gallery-categories/')
      .then((res) => setCategories(res.data || []))
      .catch((err) => setError(readableError(err, 'Unable to load gallery categories.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setCreating(true)
    try {
      await api.post('/gallery-categories/', form)
      setForm(EMPTY_FORM)
      setNotice('Gallery category created.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to create category.'))
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (c) => {
    setEditingId(c.id)
    setEditForm({ name: c.name, description: c.description || '' })
  }

  const saveEdit = async (id) => {
    setError('')
    setNotice('')
    setBusyId(id)
    try {
      await api.patch(`/gallery-categories/${id}/`, editForm)
      setEditingId(null)
      setNotice('Category updated.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to update category.'))
    } finally {
      setBusyId(null)
    }
  }

  const toggleActive = async (c) => {
    setError('')
    setNotice('')
    setBusyId(c.id)
    try {
      await api.patch(`/gallery-categories/${c.id}/`, { is_active: !c.is_active })
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to update category.'))
    } finally {
      setBusyId(null)
    }
  }

  const removeCategory = async (id) => {
    if (!confirm('Delete this gallery category? Only possible if no galleries use it.')) return
    setError('')
    setNotice('')
    setBusyId(id)
    try {
      await api.delete(`/gallery-categories/${id}/`)
      setNotice('Category deleted.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to delete category.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <Link to="/admin/galleries" className="text-sm text-slate-500 hover:text-slate-800">← All Galleries</Link>
        <h1 className="text-3xl font-bold mt-1">Gallery Categories</h1>
        <p className="text-slate-600 mt-2">
          Unlimited categories (Sunday Services, Crusades, Youth Ministry, Weddings, and any custom ones you need).
        </p>
      </div>

      {error && <div className="rounded-3xl bg-red-100 p-6 text-red-800">{error}</div>}
      {notice && <div className="rounded-3xl bg-green-100 p-6 text-green-800">{notice}</div>}

      <form onSubmit={handleCreate} className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-xl font-semibold">Add Category</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <label>
            <span className="text-slate-700 text-sm">Name</span>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Overnight Kesha" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Description (optional)</span>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
        </div>
        <button disabled={creating} type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60">
          {creating ? 'Creating…' : 'Create Category'}
        </button>
      </form>

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold mb-4">All Categories</h2>
        {loading ? (
          <div className="text-slate-500">Loading…</div>
        ) : categories.length === 0 ? (
          <div className="text-slate-500 text-sm">No categories yet.</div>
        ) : (
          <div className="grid gap-3">
            {categories.map((c) => {
              const busy = busyId === c.id
              return (
                <div key={c.id} className="rounded-2xl border border-slate-200 p-5">
                  {editingId === c.id ? (
                    <div className="flex flex-col md:flex-row gap-3 md:items-center">
                      <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="rounded-xl border border-slate-300 px-3 py-2 flex-1" />
                      <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" className="rounded-xl border border-slate-300 px-3 py-2 flex-1" />
                      <div className="flex gap-2">
                        <button disabled={busy} onClick={() => saveEdit(c.id)} className="rounded-full bg-slate-900 text-white px-4 py-1.5 text-sm font-semibold disabled:opacity-60">Save</button>
                        <button onClick={() => setEditingId(null)} className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{c.name}</h3>
                        {c.description && <p className="text-slate-600 text-sm">{c.description}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${c.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button disabled={busy} onClick={() => toggleActive(c)} className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold disabled:opacity-60">
                          {c.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button disabled={busy} onClick={() => startEdit(c)} className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold disabled:opacity-60">Edit</button>
                        <button disabled={busy} onClick={() => removeCategory(c.id)} className="rounded-full bg-red-500/15 text-red-700 px-4 py-1.5 text-sm font-semibold hover:bg-red-500/25 disabled:opacity-60">Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
