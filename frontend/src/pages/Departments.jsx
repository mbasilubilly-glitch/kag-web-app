import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'


function uniq(arr) {
  return Array.from(new Set(arr))
}

export default function Departments() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [homecells, setHomecells] = useState([])
  const [ministries, setMinistries] = useState([])

  const [selectedHomecellId, setSelectedHomecellId] = useState('')
  const [selectedMinistryIds, setSelectedMinistryIds] = useState([])
  const [ministryStatuses, setMinistryStatuses] = useState({})

  const [mediaTeamStatus, setMediaTeamStatus] = useState(null)
  const [mediaTeamBusy, setMediaTeamBusy] = useState(false)
  const [mediaTeamError, setMediaTeamError] = useState('')

  const loadMediaTeamStatus = () => api.get('/media-team/mine/').then((res) => setMediaTeamStatus(res.data))

  const requestJoinMediaTeam = async () => {
    setMediaTeamError('')
    setMediaTeamBusy(true)
    try {
      await api.post('/media-team/join-request/')
      await loadMediaTeamStatus()
    } catch (err) {
      setMediaTeamError(err?.response?.data?.detail || 'Unable to submit your request right now.')
    } finally {
      setMediaTeamBusy(false)
    }
  }

  const load = async ({ showSpinner = true } = {}) => {
    if (showSpinner) setLoading(true)
    setError('')
    try {
      const [homecellRes, snapshotRes, ministriesRes] = await Promise.all([
        api.get('/homecells/'),
        api.get('/member-departments/snapshot/'),
        api.get('/ministries/'),
        loadMediaTeamStatus(),
      ])

      const homecellData = homecellRes.data || []
      const snapshotData = snapshotRes.data || {}

      setHomecells(homecellData)

      const myHomecell = snapshotData.homecell
      setSelectedHomecellId(myHomecell?.id ? String(myHomecell.id) : '')

      // Snapshot response includes `selected_ministry_ids` (as strings) and
      // a parallel `selected_ministry_statuses` map (PENDING/APPROVED/REJECTED).
      const normalizedIds = (snapshotData.selected_ministry_ids || []).map((id) => String(id))
      setSelectedMinistryIds(uniq(normalizedIds))
      setMinistryStatuses(snapshotData.selected_ministry_statuses || {})

      const ministriesData = ministriesRes.data || []
      setMinistries(ministriesData)
    } catch (e) {
      setError('Unable to load department preferences.')
    } finally {
      if (showSpinner) setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleMinistry = (id) => {
    const sid = String(id)
    setSelectedMinistryIds((prev) => {
      if (prev.includes(sid)) return prev.filter((x) => x !== sid)
      return [...prev, sid]
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!selectedHomecellId) {
      setError('Please select a homecell.')
      return
    }
    if (!selectedMinistryIds.length) {
      setError('Please select at least one ministry.')
      return
    }

    try {
      await api.post('/member-departments/register/', {
        homecell_id: Number(selectedHomecellId),
        ministry_ids: selectedMinistryIds.map(Number),
      })

      await load({ showSpinner: false })
      alert('Saved. New ministry selections are now pending approval from that ministry\'s admin/leader.')
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message
      setError(detail || 'Unable to save your departments right now.')
    }
  }

  return (
    <div className="container py-10 space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Departments</h1>
        <p className="text-slate-600 mt-2">Choose your homecell and ministry areas of service.</p>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-slate-100 p-10 text-center text-slate-600">Loading…</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Homecell</h2>
            <label className="block">
              <span className="text-slate-700">Select Homecell</span>
              <select
                value={selectedHomecellId}
                onChange={(e) => setSelectedHomecellId(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 bg-white"
              >
                <option value="">-- Choose --</option>
                {homecells.map((h) => (
                  <option key={h.id} value={String(h.id)}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
            {selectedHomecellId && (
              <Link to="/my-homecell" className="inline-block mt-4 text-primary-600 font-semibold hover:underline">
                View my homecell's details →
              </Link>
            )}
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Ministries</h2>

            <div className="text-sm text-slate-600 mb-4">
              Joining a ministry is subject to approval by that ministry's admin/leader — newly
              selected ministries show as "Pending" until reviewed. Removing a selection leaves
              immediately, no approval needed.
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedMinistryIds.length ? (
                selectedMinistryIds.map((id) => {
                  const ministry = ministries.find((m) => String(m.id) === String(id))
                  const label = ministry?.ministry_name || `Ministry #${id}`
                  const memberStatus = ministryStatuses[id]

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleMinistry(id)}
                      className="rounded-full bg-slate-900 text-white pl-4 pr-2 py-2 text-sm font-semibold inline-flex items-center gap-2"
                    >
                      {label}
                      {memberStatus === 'PENDING' && (
                        <span className="rounded-full bg-amber-400 text-amber-900 px-2 py-0.5 text-xs font-bold">Pending</span>
                      )}
                      {memberStatus === 'REJECTED' && (
                        <span className="rounded-full bg-red-400 text-red-900 px-2 py-0.5 text-xs font-bold">Rejected</span>
                      )}
                      {memberStatus === 'APPROVED' && (
                        <span className="rounded-full bg-green-400 text-green-900 px-2 py-0.5 text-xs font-bold">Member</span>
                      )}
                    </button>
                  )
                })
              ) : (
                <div className="text-slate-500">No ministries selected.</div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Available Ministries</h3>
              <div className="flex flex-wrap gap-2">
                {ministries.filter((m) => !selectedMinistryIds.includes(String(m.id))).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMinistry(m.id)}
                    className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 text-sm font-semibold"
                  >
                    + {m.ministry_name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Media Team</h2>
            <p className="text-slate-600 text-sm mb-4">
              Serve through photography, videography, sound, live streaming, or graphics. Joining is
              subject to approval by a Church Admin.
            </p>
            {mediaTeamError && <div className="p-4 bg-red-100 text-red-800 rounded mb-4">{mediaTeamError}</div>}
            {mediaTeamStatus?.status === 'APPROVED' ? (
              <span className="rounded-full bg-green-100 text-green-800 px-4 py-2 text-sm font-semibold">✓ You are on the Media Team{mediaTeamStatus.role ? ` — ${mediaTeamStatus.role}` : ''}</span>
            ) : mediaTeamStatus?.status === 'PENDING' ? (
              <span className="rounded-full bg-amber-100 text-amber-800 px-4 py-2 text-sm font-semibold">Pending approval</span>
            ) : (
              <button
                type="button"
                disabled={mediaTeamBusy}
                onClick={requestJoinMediaTeam}
                className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60"
              >
                {mediaTeamBusy ? 'Submitting…' : mediaTeamStatus?.status === 'REJECTED' ? 'Request Again' : 'Request to Join Media Team'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold"
            >
              Save Preferences
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

