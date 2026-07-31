import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Ministries() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])

  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/ministries/')
        if (!mounted) return
        setItems(res.data || [])
      } catch (e) {
        if (!mounted) return
        setError('Unable to load ministries.')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const selectedCount = useMemo(() => {
    // This page is browse-only; enrollment happens in SingleMinistry.
    return 0
  }, [])

  return (
    <div className="container py-10 space-y-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Ministries</h1>
        <p className="text-slate-600 mt-2">Choose where you would like to serve.</p>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-slate-100 p-10 text-center text-slate-600">Loading…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <div
              key={m.id}
              className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100"
            >
              <h2 className="text-xl font-semibold">{m.ministry_name}</h2>
              <p className="text-sm text-slate-600 mt-2 line-clamp-3">{m.description || '—'}</p>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/ministries/${m.id}`)}
                  className="rounded-2xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold"
                >
                  View / Join
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}
    </div>
  )
}

