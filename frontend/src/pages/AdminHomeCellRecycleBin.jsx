import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { extractErrorMessage as readableError } from '../utils/errors'

export default function AdminHomeCellRecycleBin() {
  const [homecells, setHomecells] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/admin/homecells/recycle-bin/')
      .then((res) => setHomecells(res.data?.homecells || []))
      .catch((err) => setError(readableError(err, 'Unable to load the recycle bin.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const restore = async (id) => {
    setError('')
    setNotice('')
    setBusyId(id)
    try {
      await api.post('/admin/homecells/recycle-bin/restore/', { id })
      setNotice('Restored.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to restore this Home Cell Fellowship.'))
    } finally {
      setBusyId(null)
    }
  }

  const permanentlyDelete = async (id) => {
    if (!confirm('Permanently delete this Home Cell Fellowship? This cannot be undone.')) return
    setError('')
    setNotice('')
    setBusyId(id)
    try {
      await api.post('/admin/homecells/recycle-bin/permanent-delete/', { id })
      setNotice('Permanently deleted.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to permanently delete this Home Cell Fellowship.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <Link to="/admin/homecells" className="text-sm text-slate-500 hover:text-slate-800">← All Home Cell Fellowships</Link>
        <h1 className="text-3xl font-bold mt-1">Recycle Bin</h1>
        <p className="text-slate-600 mt-2">
          Deleted Home Cell Fellowships stay here until restored or permanently deleted.
        </p>
      </div>

      {error && <div className="rounded-3xl bg-red-100 p-6 text-red-800">{error}</div>}
      {notice && <div className="rounded-3xl bg-green-100 p-6 text-green-800">{notice}</div>}

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        {loading ? (
          <div className="text-slate-500">Loading…</div>
        ) : homecells.length === 0 ? (
          <div className="text-slate-500 text-sm">Nothing here.</div>
        ) : (
          <div className="grid gap-3">
            {homecells.map((h) => {
              const busy = busyId === h.id
              return (
                <div key={h.id} className="rounded-2xl border border-slate-200 p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">{h.ministry_name}</p>
                    <p className="text-slate-500 text-xs">Deleted {h.deleted_at ? new Date(h.deleted_at).toLocaleString() : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <button disabled={busy} onClick={() => restore(h.id)} className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold disabled:opacity-60">Restore</button>
                    <button disabled={busy} onClick={() => permanentlyDelete(h.id)} className="rounded-full bg-red-500/15 text-red-700 px-4 py-1.5 text-sm font-semibold hover:bg-red-500/25 disabled:opacity-60">Delete Permanently</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
