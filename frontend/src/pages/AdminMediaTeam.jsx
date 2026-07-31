import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { extractErrorMessage } from '../utils/errors'

function readableError(err, fallback) {
  return extractErrorMessage(err, fallback, { fields: ['user'] })
}

export default function AdminMediaTeam({ basePath = '/admin/media-team' }) {
  const [members, setMembers] = useState([])
  const [joinRequests, setJoinRequests] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [roleDrafts, setRoleDrafts] = useState({})

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([
      api.get('/admin/media-team/'),
      api.get('/admin/media-team/join-requests/'),
    ])
      .then(([membersRes, requestsRes]) => {
        setMembers(membersRes.data || [])
        setJoinRequests(requestsRes.data || [])
        const drafts = {}
        for (const m of membersRes.data || []) drafts[m.id] = m.role || ''
        setRoleDrafts(drafts)
      })
      .catch((err) => setError(readableError(err, 'Unable to load the Media Team.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    // /users/ is paginated - page_size=100 is a stopgap so this picker
    // still resembles "everyone" up to 100 users; beyond that this needs
    // a real search picker (see roadmap).
    api.get('/users/?page_size=100').then((res) => setUsers(res.data?.results || [])).catch(() => {})
  }, [])

  const memberUserIds = new Set(members.map((m) => m.user))
  const candidates = users.filter((u) => !memberUserIds.has(u.id))
  const filteredCandidates = search
    ? candidates.filter((u) => `${u.first_name} ${u.last_name} ${u.username} ${u.email}`.toLowerCase().includes(search.toLowerCase()))
    : candidates

  const addMember = async (e) => {
    e.preventDefault()
    if (!selectedUserId) {
      setError('Choose a user to add first.')
      return
    }
    setError('')
    setNotice('')
    setAdding(true)
    try {
      await api.post('/admin/media-team/', { user: Number(selectedUserId), role: selectedRole })
      setSelectedUserId('')
      setSelectedRole('')
      setSearch('')
      setNotice('Added to Media Team.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to add this user.'))
    } finally {
      setAdding(false)
    }
  }

  const removeMember = async (id) => {
    if (!confirm('Remove this person from the Media Team? They will lose gallery-management access.')) return
    setError('')
    setBusyId(id)
    try {
      await api.delete(`/admin/media-team/${id}/`)
      setNotice('Removed from Media Team.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to remove this member.'))
    } finally {
      setBusyId(null)
    }
  }

  const toggleActive = async (m) => {
    setError('')
    setBusyId(m.id)
    try {
      await api.patch(`/admin/media-team/${m.id}/`, { is_active: !m.is_active })
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to update this member.'))
    } finally {
      setBusyId(null)
    }
  }

  const saveRole = async (m) => {
    setError('')
    setBusyId(m.id)
    try {
      await api.patch(`/admin/media-team/${m.id}/`, { role: roleDrafts[m.id] || '' })
      setNotice('Role updated.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to update role.'))
    } finally {
      setBusyId(null)
    }
  }

  const decideJoinRequest = async (id, decision) => {
    setError('')
    setBusyId(id)
    try {
      await api.post(`/admin/media-team/join-requests/${id}/`, { status: decision })
      setNotice(decision === 'APPROVED' ? 'Request approved.' : 'Request rejected.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to decide this request.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Media Team</h1>
          <p className="text-slate-600 mt-2">
            Grant specific members gallery-management access (create/upload/edit/delete photo &amp; video
            galleries) without making them full Church Administrators. Their role elsewhere is unchanged.
          </p>
        </div>
        <Link to={`${basePath}/dashboard`} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold">Dashboard</Link>
      </div>

      {error && <div className="rounded-3xl bg-red-100 p-6 text-red-800">{error}</div>}
      {notice && <div className="rounded-3xl bg-green-100 p-6 text-green-800">{notice}</div>}

      {joinRequests.length > 0 && (
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-semibold mb-4">Pending Join Requests ({joinRequests.length})</h2>
          <div className="grid gap-2">
            {joinRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <div>
                  <span className="font-semibold">{r.user_name}</span>
                  <span className="ml-2 text-slate-500 text-sm">{r.email}</span>
                </div>
                <div className="flex gap-2">
                  <button disabled={busyId === r.id} onClick={() => decideJoinRequest(r.id, 'APPROVED')} className="rounded-full bg-green-500/15 text-green-700 px-4 py-1.5 text-sm font-semibold hover:bg-green-500/25 disabled:opacity-60">Approve</button>
                  <button disabled={busyId === r.id} onClick={() => decideJoinRequest(r.id, 'REJECTED')} className="rounded-full bg-red-500/15 text-red-700 px-4 py-1.5 text-sm font-semibold hover:bg-red-500/25 disabled:opacity-60">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={addMember} className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-xl font-semibold">Add to Media Team</h2>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, username, or email…"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
        />
        <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3">
          <option value="">— Select a user —</option>
          {filteredCandidates.map((u) => (
            <option key={u.id} value={u.id}>
              {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : u.username} ({u.username}) — {u.profile?.role || 'Member'}
            </option>
          ))}
        </select>
        <input
          value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}
          placeholder="Assigned role (optional) — e.g. Camera Operator, Photographer, Sound Technician"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
        />
        <button disabled={adding} type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60">
          {adding ? 'Adding…' : 'Add to Media Team'}
        </button>
      </form>

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold mb-4">Current Media Team ({members.length})</h2>
        {loading ? (
          <div className="text-slate-500">Loading…</div>
        ) : members.length === 0 ? (
          <div className="text-slate-500 text-sm">No Media Team members yet.</div>
        ) : (
          <div className="grid gap-3">
            {members.map((m) => (
              <div key={m.id} className="rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  {m.profile_picture ? (
                    <img src={m.profile_picture} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-lg">👤</div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      {m.user_name} <span className="text-slate-500 font-normal">({m.username})</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {m.status === 'REJECTED' && (
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800">Previously Rejected</span>
                      )}
                    </h3>
                    <p className="text-slate-600 text-sm">
                      {m.email} · {m.phone || 'No phone'} · Joined {new Date(m.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={roleDrafts[m.id] ?? ''}
                    onChange={(e) => setRoleDrafts({ ...roleDrafts, [m.id]: e.target.value })}
                    placeholder="Assigned role"
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-sm w-48"
                  />
                  <button disabled={busyId === m.id} onClick={() => saveRole(m)} className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold disabled:opacity-60">Save Role</button>
                  <button disabled={busyId === m.id} onClick={() => toggleActive(m)} className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold disabled:opacity-60">
                    {m.is_active ? 'Suspend' : 'Activate'}
                  </button>
                  <button disabled={busyId === m.id} onClick={() => removeMember(m.id)} className="rounded-full bg-red-500/15 text-red-700 px-4 py-1.5 text-sm font-semibold hover:bg-red-500/25 disabled:opacity-60">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
