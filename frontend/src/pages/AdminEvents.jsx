import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function AdminEvents({ basePath = '/admin/events' }) {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/events/')
      .then((res) => setItems(res.data))
      .catch(() => setError('Unable to load events'))
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return
    try {
      await api.delete(`/events/${id}/`)
      setItems(items.filter((i) => i.id !== id))
    } catch {
      setError('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link to={`${basePath}/new`} className="rounded-2xl bg-slate-900 text-white px-4 py-2 text-sm">Create Event</Link>
      </div>
      {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}
      <div className="grid gap-4">
        {items.map((e) => (
          <div key={e.id} className="rounded-2xl bg-white p-4 flex justify-between items-center border">
            <div>
              <div className="font-semibold">{e.title}</div>
              <div className="text-sm text-slate-600">{new Date(e.date).toLocaleDateString()}</div>
            </div>
            <div className="flex gap-3">
              <Link to={`/events/${e.id}`} className="text-slate-700 hover:text-slate-900">View</Link>
              <Link to={`${basePath}/${e.id}/edit`} className="text-slate-700 hover:text-slate-900">Edit</Link>
              <button onClick={() => handleDelete(e.id)} className="text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
