import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api'
import { extractErrorMessage } from '../utils/errors'

const MEETING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MAX_DEPARTMENT_ADMINS = 4

function readableError(err, fallback) {
  return extractErrorMessage(err, fallback)
}

export default function AdminMinistryDetail() {
  const { id } = useParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  const [members, setMembers] = useState([])
  const [joinRequests, setJoinRequests] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [addUserId, setAddUserId] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [decidingId, setDecidingId] = useState(null)

  const [assignments, setAssignments] = useState([])
  const [assignUserId, setAssignUserId] = useState('')
  const [assignRole, setAssignRole] = useState('leader')
  const [assignDuties, setAssignDuties] = useState('')
  const [assigning, setAssigning] = useState(false)

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([
      api.get(`/admin/ministries/${id}/`),
      api.get(`/ministries/${id}/members/`),
      api.get(`/ministries/${id}/join-requests/`),
      // /users/ is paginated - page_size=100 is a stopgap so these pickers
      // still resemble "everyone" up to 100 users; beyond that this needs
      // a real search picker (see roadmap).
      api.get('/users/?page_size=100'),
      api.get(`/department-admin-assignments/departments/${id}/`),
    ])
      .then(([ministryRes, membersRes, joinRequestsRes, usersRes, assignmentsRes]) => {
        setForm(ministryRes.data)
        setMembers(membersRes.data || [])
        setJoinRequests(joinRequestsRes.data || [])
        setAllUsers(usersRes.data?.results || [])
        setAssignments(assignmentsRes.data || [])
      })
      .catch((err) => setError(readableError(err, 'Unable to load this ministry.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const memberUserIds = useMemo(() => new Set(members.map((m) => String(m.user_id))), [members])
  const availableToAdd = useMemo(
    () => allUsers.filter((u) => !memberUserIds.has(String(u.id))),
    [allUsers, memberUserIds]
  )

  const assignedUserIds = useMemo(
    () => new Set(assignments.map((a) => String(a.admin_user_id || a.admin?.id))),
    [assignments]
  )
  const availableToAssign = useMemo(
    () => allUsers.filter((u) => !assignedUserIds.has(String(u.id))),
    [allUsers, assignedUserIds]
  )

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const saveForm = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setSaving(true)
    try {
      const payload = { ...form, max_capacity: form.max_capacity || null, meeting_time: form.meeting_time || null }
      delete payload.category
      delete payload.status
      delete payload.created_at
      delete payload.updated_at
      const res = await api.patch(`/admin/ministries/${id}/`, payload)
      setForm(res.data)
      setNotice('Saved.')
    } catch (err) {
      setError(readableError(err, 'Unable to save changes.'))
    } finally {
      setSaving(false)
    }
  }

  const addMember = async (e) => {
    e.preventDefault()
    if (!addUserId) return
    setError('')
    setNotice('')
    setAddingMember(true)
    try {
      await api.post(`/ministries/${id}/members-manage/`, { user_id: Number(addUserId) })
      setAddUserId('')
      setNotice('Member registered to this ministry.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to register this member.'))
    } finally {
      setAddingMember(false)
    }
  }

  const removeMember = async (userId) => {
    if (!confirm('Remove this member from the ministry?')) return
    setError('')
    setNotice('')
    try {
      await api.delete(`/ministries/${id}/members-manage/${userId}/`)
      setNotice('Member removed.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to remove this member.'))
    }
  }

  const decideJoinRequest = async (requestId, decision) => {
    setError('')
    setNotice('')
    setDecidingId(requestId)
    try {
      await api.post(`/ministries/${id}/join-requests/${requestId}/`, { status: decision })
      setNotice(decision === 'APPROVED' ? 'Request approved.' : 'Request rejected.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to decide this request.'))
    } finally {
      setDecidingId(null)
    }
  }

  const assignLeader = async (e) => {
    e.preventDefault()
    if (!assignUserId) return
    setError('')
    setNotice('')
    setAssigning(true)
    try {
      await api.post('/department-admin-assignments/', {
        department_id: Number(id),
        admin_user_id: Number(assignUserId),
        assignment_role: assignRole,
        duties: assignDuties,
      })
      setAssignUserId('')
      setAssignDuties('')
      setNotice(`Assigned as ${assignRole === 'leader' ? 'Leader' : 'Assistant Leader'}.`)
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to assign this leader.'))
    } finally {
      setAssigning(false)
    }
  }

  const removeAssignment = async (assignmentId) => {
    if (!confirm('Remove this leader assignment?')) return
    setError('')
    setNotice('')
    try {
      await api.delete(`/department-admin-assignments/${assignmentId}/`)
      setNotice('Assignment removed.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to remove this assignment.'))
    }
  }

  if (loading) return <div className="p-10 text-center text-slate-500">Loading…</div>
  if (!form) return <div className="p-10 text-center text-red-700">{error || 'Not found.'}</div>

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <Link to="/admin/ministries" className="text-sm text-slate-500 hover:text-slate-800">← All Ministries</Link>
        <h1 className="text-3xl font-bold mt-1">{form.ministry_name}</h1>
        <p className="text-slate-600 mt-2">
          <Link to={`/ministries/${id}/dashboard`} className="text-primary-600 font-semibold hover:underline">Open this ministry's console →</Link>
        </p>
      </div>

      {error && <div className="rounded-3xl bg-red-100 p-6 text-red-800">{error}</div>}
      {notice && <div className="rounded-3xl bg-green-100 p-6 text-green-800">{notice}</div>}

      <form onSubmit={saveForm} className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-xl font-semibold">Ministry Information</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <label>
            <span className="text-slate-700 text-sm">Name</span>
            <input required value={form.ministry_name} onChange={set('ministry_name')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Description</span>
            <input value={form.description} onChange={set('description')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Meeting Day</span>
            <select value={form.meeting_day} onChange={set('meeting_day')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3">
              <option value="">Select…</option>
              {MEETING_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label>
            <span className="text-slate-700 text-sm">Meeting Time</span>
            <input type="time" value={form.meeting_time || ''} onChange={set('meeting_time')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Meeting Venue</span>
            <input value={form.meeting_venue} onChange={set('meeting_venue')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Physical Address</span>
            <input value={form.physical_address} onChange={set('physical_address')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Area/Location</span>
            <input value={form.area_location} onChange={set('area_location')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">County</span>
            <input value={form.county} onChange={set('county')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Church Branch</span>
            <input value={form.church_branch} onChange={set('church_branch')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Contact Phone Number</span>
            <input value={form.contact_phone} onChange={set('contact_phone')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Email Address (optional)</span>
            <input type="email" value={form.contact_email} onChange={set('contact_email')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Maximum Capacity</span>
            <input type="number" min="0" value={form.max_capacity || ''} onChange={set('max_capacity')} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
        </div>
        <button disabled={saving} type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-semibold">Leaders & Assistant Leaders</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${assignments.length >= MAX_DEPARTMENT_ADMINS ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
            {assignments.length >= MAX_DEPARTMENT_ADMINS ? '✓' : '⚠️'} {assignments.length} of {MAX_DEPARTMENT_ADMINS} admins assigned
          </span>
        </div>
        {assignments.length >= MAX_DEPARTMENT_ADMINS ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            This ministry already has the maximum of {MAX_DEPARTMENT_ADMINS} admins. Remove one before assigning another.
          </p>
        ) : (
          <form onSubmit={assignLeader} className="flex flex-wrap items-end gap-3">
            <label className="flex-1 min-w-[200px]">
              <span className="text-slate-700 text-sm">Member</span>
              <select required value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3">
                <option value="">Select a member…</option>
                {availableToAssign.map((u) => (
                  <option key={u.id} value={u.id}>{`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-slate-700 text-sm">Role</span>
              <select value={assignRole} onChange={(e) => setAssignRole(e.target.value)} className="mt-2 rounded-2xl border border-slate-300 px-4 py-3">
                <option value="leader">Leader</option>
                <option value="assistant_leader">Assistant Leader</option>
              </select>
            </label>
            <button disabled={assigning} type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60">
              {assigning ? 'Assigning…' : 'Assign'}
            </button>
            <label className="w-full">
              <span className="text-slate-700 text-sm">Duties (optional)</span>
              <textarea
                rows={2}
                value={assignDuties}
                onChange={(e) => setAssignDuties(e.target.value)}
                placeholder="e.g. Reviews and approves membership requests"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
          </form>
        )}
        <p className="text-xs text-slate-500">Assigning a member here grants them access to this ministry's console, promoting them to Administrator role if needed.</p>

        {assignments.length === 0 ? (
          <div className="text-slate-500 text-sm">No leaders assigned yet.</div>
        ) : (
          <div className="grid gap-2">
            {assignments.map((a, i) => (
              <div key={a.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="text-slate-400 text-sm font-semibold w-5 shrink-0">{i + 1}.</span>
                  <div>
                    <span className="font-semibold">{a.admin?.username || `User #${a.admin_user_id}`}</span>
                    <span className="ml-2 text-xs rounded-full bg-slate-100 px-2 py-0.5 font-semibold">
                      {a.assignment_role === 'assistant_leader' ? 'Assistant Leader' : 'Leader'}
                    </span>
                    {a.duties && <div className="text-slate-500 text-xs mt-1">{a.duties}</div>}
                  </div>
                </div>
                <button onClick={() => removeAssignment(a.id)} className="rounded-full bg-red-500/15 text-red-700 px-4 py-1.5 text-sm font-semibold hover:bg-red-500/25">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-xl font-semibold">Pending Join Requests ({joinRequests.length})</h2>
        {joinRequests.length === 0 ? (
          <div className="text-slate-500 text-sm">No pending requests.</div>
        ) : (
          <div className="grid gap-2">
            {joinRequests.map((r) => {
              const busy = decidingId === r.id
              return (
                <div key={r.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <div>
                    <span className="font-semibold">{`${r.first_name || ''} ${r.last_name || ''}`.trim() || r.email}</span>
                    <span className="ml-2 text-slate-500 text-sm">{r.email}</span>
                  </div>
                  <div className="flex gap-2">
                    <button disabled={busy} onClick={() => decideJoinRequest(r.id, 'APPROVED')} className="rounded-full bg-green-500/15 text-green-700 px-4 py-1.5 text-sm font-semibold hover:bg-green-500/25 disabled:opacity-60">Approve</button>
                    <button disabled={busy} onClick={() => decideJoinRequest(r.id, 'REJECTED')} className="rounded-full bg-red-500/15 text-red-700 px-4 py-1.5 text-sm font-semibold hover:bg-red-500/25 disabled:opacity-60">Reject</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-xl font-semibold">Members ({members.length})</h2>
        <form onSubmit={addMember} className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[200px]">
            <span className="text-slate-700 text-sm">Register a member directly</span>
            <select value={addUserId} onChange={(e) => setAddUserId(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3">
              <option value="">Select a member…</option>
              {availableToAdd.map((u) => (
                <option key={u.id} value={u.id}>{`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username}</option>
              ))}
            </select>
          </label>
          <button disabled={addingMember || !addUserId} type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60">
            {addingMember ? 'Adding…' : 'Add Member'}
          </button>
        </form>
        <p className="text-xs text-slate-500">Registering someone here counts as pre-approved — it skips the pending-request queue above.</p>

        {members.length === 0 ? (
          <div className="text-slate-500 text-sm">No members registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 px-3 font-semibold">#</th>
                  <th className="py-2 px-3 font-semibold">Name</th>
                  <th className="py-2 px-3 font-semibold">Email</th>
                  <th className="py-2 px-3 font-semibold">Phone</th>
                  <th className="py-2 px-3 font-semibold">Role</th>
                  <th className="py-2 px-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => (
                  <tr key={m.user_id} className="border-b border-slate-100">
                    <td className="py-2 px-3 text-slate-400">{i + 1}</td>
                    <td className="py-2 px-3">{`${m.first_name || ''} ${m.last_name || ''}`.trim() || '—'}</td>
                    <td className="py-2 px-3 text-slate-600">{m.email || '—'}</td>
                    <td className="py-2 px-3 text-slate-600">{m.phone || '—'}</td>
                    <td className="py-2 px-3 text-slate-600">{m.role || '—'}</td>
                    <td className="py-2 px-3">
                      <button onClick={() => removeMember(m.user_id)} className="rounded-full bg-red-500/15 text-red-700 px-3 py-1 text-xs font-semibold hover:bg-red-500/25">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
