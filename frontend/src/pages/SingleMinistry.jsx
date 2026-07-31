import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'
import OnlineMeetingsCard from '../components/OnlineMeetingsCard'

export default function SingleMinistry() {
  const { id } = useParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [ministry, setMinistry] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [ministryStatuses, setMinistryStatuses] = useState({})
  const [homecell, setHomecell] = useState(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        // We can load the single ministry from the directory.
        const ministryRes = await api.get(`/ministries/${id}/`)

        // We also need the member's current enrollment to know if they are enrolled.
        const snapshotRes = await api.get('/member-departments/snapshot/')
        const snapshotData = snapshotRes.data || {}

        if (!mounted) return

        setMinistry(ministryRes.data || null)
        setHomecell(snapshotData.homecell || null)

        const ids = snapshotData.selected_ministry_ids || []
        setSelectedIds(ids.map((x) => String(x)))
        setMinistryStatuses(snapshotData.selected_ministry_statuses || {})
      } catch (e) {
        if (!mounted) return
        setError('Unable to load ministry details.')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [id])

  const isSelected = useMemo(() => selectedIds.includes(String(id)), [selectedIds, id])

  const handleJoinToggle = async () => {
    setError('')

    if (!homecell?.id) {
      setError('Please set your homecell first in Departments.')
      return
    }

    try {
      const ministryIdNum = Number(id)
      const next = isSelected
        ? selectedIds.filter((x) => String(x) !== String(id))
        : [...selectedIds, String(id)]

      if (next.length === 0) {
        setError('Please select at least one ministry.')
        return
      }

      await api.post('/member-departments/register/', {
        homecell_id: Number(homecell.id),
        ministry_ids: next.map((x) => Number(x)),
      })

      const snapshotRes = await api.get('/member-departments/snapshot/')
      const snapshotData = snapshotRes.data || {}
      setSelectedIds((snapshotData.selected_ministry_ids || []).map((x) => String(x)))
      setMinistryStatuses(snapshotData.selected_ministry_statuses || {})
    } catch (e) {
      const detail = e?.response?.data?.detail || e?.message
      setError(detail || 'Unable to update ministry enrollment.')
    }
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="rounded-3xl bg-slate-100 p-10 text-center text-slate-600">Loading…</div>
      </div>
    )
  }

  if (!ministry) {
    return (
      <div className="container py-10">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Ministry not found</h1>
          <div className="text-slate-600 mt-2">The ministry you requested does not exist.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10 space-y-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">{ministry.ministry_name}</h1>
        <p className="text-slate-600 mt-2">{ministry.description || ''}</p>
        <div className="text-sm text-slate-500 mt-4">
          {ministry.leader ? `Leader: ${ministry.leader}` : ''}
        </div>

        {error && <div className="p-4 bg-red-100 text-red-800 rounded mt-4">{error}</div>}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleJoinToggle}
            className={`rounded-2xl px-6 py-3 font-semibold ${
              isSelected ? 'bg-slate-200 text-slate-900' : 'bg-slate-900 text-white'
            }`}
          >
            {isSelected ? 'Leave Ministry' : 'Request to Join'}
          </button>

          {isSelected && ministryStatuses[String(id)] === 'PENDING' && (
            <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-semibold">Pending approval</span>
          )}
          {isSelected && ministryStatuses[String(id)] === 'APPROVED' && (
            <span className="rounded-full bg-green-100 text-green-800 px-3 py-1 text-xs font-semibold">Member</span>
          )}
          {isSelected && ministryStatuses[String(id)] === 'REJECTED' && (
            <span className="rounded-full bg-red-100 text-red-800 px-3 py-1 text-xs font-semibold">Request rejected</span>
          )}

          {homecell?.name ? (
            <div className="text-sm text-slate-700">
              Homecell: <span className="font-semibold">{homecell.name}</span>
            </div>
          ) : (
            <div className="text-sm text-slate-700">No homecell selected yet.</div>
          )}
        </div>
      </div>

      {isSelected && ministryStatuses[String(id)] === 'APPROVED' && (
        <OnlineMeetingsCard ministryId={id} />
      )}
    </div>
  )
}

