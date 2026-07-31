import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { extractErrorMessage as readableError } from '../utils/errors'

const SECTIONS = [
  { type: 'gallery', key: 'galleries', label: 'Galleries', nameOf: (o) => o.title },
  { type: 'album', key: 'albums', label: 'Albums', nameOf: (o) => o.name },
  { type: 'item', key: 'items', label: 'Photos & Videos', nameOf: (o) => o.caption || o.title || `${o.item_type} #${o.id}` },
]

export default function AdminGalleryRecycleBin() {
  const [bin, setBin] = useState({ galleries: [], albums: [], items: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyKey, setBusyKey] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/galleries/recycle-bin/')
      .then((res) => setBin(res.data || { galleries: [], albums: [], items: [] }))
      .catch((err) => setError(readableError(err, 'Unable to load the recycle bin.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const restore = async (type, id) => {
    setError('')
    setNotice('')
    setBusyKey(`${type}-${id}`)
    try {
      await api.post('/galleries/recycle-bin/restore/', { type, id })
      setNotice('Restored.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to restore this item.'))
    } finally {
      setBusyKey(null)
    }
  }

  const permanentlyDelete = async (type, id) => {
    if (!confirm('Permanently delete this? This cannot be undone.')) return
    setError('')
    setNotice('')
    setBusyKey(`${type}-${id}`)
    try {
      await api.post('/galleries/recycle-bin/permanent-delete/', { type, id })
      setNotice('Permanently deleted.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to permanently delete this item.'))
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <Link to="/admin/galleries" className="text-sm text-slate-500 hover:text-slate-800">← All Galleries</Link>
        <h1 className="text-3xl font-bold mt-1">Recycle Bin</h1>
        <p className="text-slate-600 mt-2">
          Deleted galleries, albums, photos, and videos stay here until restored or permanently deleted.
        </p>
      </div>

      {error && <div className="rounded-3xl bg-red-100 p-6 text-red-800">{error}</div>}
      {notice && <div className="rounded-3xl bg-green-100 p-6 text-green-800">{notice}</div>}

      {loading ? (
        <div className="text-slate-500">Loading…</div>
      ) : (
        SECTIONS.map((section) => {
          const list = bin[section.key] || []
          return (
            <div key={section.type} className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
              <h2 className="text-xl font-semibold mb-4">{section.label} ({list.length})</h2>
              {list.length === 0 ? (
                <div className="text-slate-500 text-sm">Nothing here.</div>
              ) : (
                <div className="grid gap-3">
                  {list.map((obj) => {
                    const key = `${section.type}-${obj.id}`
                    const busy = busyKey === key
                    return (
                      <div key={key} className="rounded-2xl border border-slate-200 p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold">{section.nameOf(obj)}</p>
                          <p className="text-slate-500 text-xs">Deleted {obj.deleted_at ? new Date(obj.deleted_at).toLocaleString() : ''}</p>
                        </div>
                        <div className="flex gap-2">
                          <button disabled={busy} onClick={() => restore(section.type, obj.id)} className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold disabled:opacity-60">Restore</button>
                          <button disabled={busy} onClick={() => permanentlyDelete(section.type, obj.id)} className="rounded-full bg-red-500/15 text-red-700 px-4 py-1.5 text-sm font-semibold hover:bg-red-500/25 disabled:opacity-60">Delete Permanently</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
