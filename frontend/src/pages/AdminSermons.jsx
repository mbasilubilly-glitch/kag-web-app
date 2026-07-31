import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function AdminSermons({ basePath = '/admin/sermons' }) {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/sermons/')
      .then((res) => setItems(res.data))
      .catch(() => setError('Unable to load sermons'))
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this sermon?')) return
    try {
      await api.delete(`/sermons/${id}/`)
      setItems(items.filter((i) => i.id !== id))
    } catch {
      setError('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sermons</h1>
        <Link to={`${basePath}/new`} className="rounded-2xl bg-slate-900 text-white px-4 py-2 text-sm">Create Sermon</Link>
      </div>
      {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}
      <div className="grid gap-4">
        {items.map((s) => (
          <div key={s.id} className="rounded-2xl bg-white p-4 flex justify-between items-center border">
            <div>
              <div className="font-semibold">{s.title}</div>
              <div className="text-sm text-slate-600">{s.speaker}</div>
            </div>
            <div className="flex gap-3">
              <Link to={`/sermons/${s.id}`} className="text-slate-700 hover:text-slate-900">View</Link>
              <Link to={`${basePath}/${s.id}/edit`} className="text-slate-700 hover:text-slate-900">Edit</Link>
              <button onClick={() => handleDelete(s.id)} className="text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
