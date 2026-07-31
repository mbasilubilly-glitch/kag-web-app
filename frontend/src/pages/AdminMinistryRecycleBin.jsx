import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { extractErrorMessage as readableError } from '../utils/errors'

export default function AdminMinistryRecycleBin() {
  const [ministries, setMinistries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/admin/ministries/recycle-bin/')
      .then((res) => setMinistries(res.data?.ministries || []))
      .catch((err) => setError(readableError(err, 'Unable to load the recycle bin.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const restore = async (id) => {
    setError('')
    setNotice('')
    setBusyId(id)
    try {
      await api.post('/admin/ministries/recycle-bin/restore/', { id })
      setNotice('Restored.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to restore this ministry.'))
    } finally {
      setBusyId(null)
    }
  }

  const permanentlyDelete = async (id) => {
    if (!confirm('Permanently delete this ministry? This cannot be undone.')) return
    setError('')
    setNotice('')
    setBusyId(id)
    try {
      await api.post('/admin/ministries/recycle-bin/permanent-delete/', { id })
      setNotice('Permanently deleted.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to permanently delete this ministry.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <Link to="/admin/ministries" className="text-sm text-slate-500 hover:text-slate-800">← All Ministries</Link>
        <h1 className="text-3xl font-bold mt-1">Recycle Bin</h1>
        <p className="text-slate-600 mt-2">
          Deleted ministries stay here until restored or permanently deleted.
        </p>
      </div>

      {error && <div className="rounded-3xl bg-red-100 p-6 text-red-800">{error}</div>}
      {notice && <div className="rounded-3xl bg-green-100 p-6 text-green-800">{notice}</div>}

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        {loading ? (
          <div className="text-slate-500">Loading…</div>
        ) : ministries.length === 0 ? (
          <div className="text-slate-500 text-sm">Nothing here.</div>
        ) : (
          <div className="grid gap-3">
            {ministries.map((m) => {
              const busy = busyId === m.id
              return (
                <div key={m.id} className="rounded-2xl border border-slate-200 p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">{m.ministry_name}</p>
                    <p className="text-slate-500 text-xs">Deleted {m.deleted_at ? new Date(m.deleted_at).toLocaleString() : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <button disabled={busy} onClick={() => restore(m.id)} className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold disabled:opacity-60">Restore</button>
                    <button disabled={busy} onClick={() => permanentlyDelete(m.id)} className="rounded-full bg-red-500/15 text-red-700 px-4 py-1.5 text-sm font-semibold hover:bg-red-500/25 disabled:opacity-60">Delete Permanently</button>
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
