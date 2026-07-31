import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import api from '../api'
import { extractErrorMessage as readableError } from '../utils/errors'
import MinistryGuard from '../components/MinistryGuard'
import MinistryConsoleNav from '../components/MinistryConsoleNav'

export default function MinistryMembers() {
  const { id } = useParams()
  const location = useLocation()
  // Homecells don't gate membership behind approval (see Ministries vs
  // Home Cell spec) - only show the join-requests section for ministries.
  const isHomecell = location.pathname.startsWith('/homecells')

  const [ministry, setMinistry] = useState(null)
  const [members, setMembers] = useState([])
  const [joinRequests, setJoinRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [decidingId, setDecidingId] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [addingId, setAddingId] = useState(null)

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [removingId, setRemovingId] = useState(null)

  const load = () => {
    setLoading(true)
    setError('')

    const requests = [
      api.get(`/ministries/${id}/`),
      api.get(`/ministries/${id}/members/`),
    ]
    if (!isHomecell) requests.push(api.get(`/ministries/${id}/join-requests/`))

    Promise.all(requests)
      .then(([ministryRes, membersRes, joinRequestsRes]) => {
        setMinistry(ministryRes.data)
        setMembers(membersRes.data)
        setJoinRequests(joinRequestsRes?.data || [])
      })
      .catch(() => {
        setError('Unable to load the member roster.')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

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

  const runSearch = async (e) => {
    e.preventDefault()
    setError('')
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await api.get(`/ministries/${id}/members-manage/search/`, { params: { q: searchQuery } })
      setSearchResults(res.data)
    } catch (err) {
      setError(readableError(err, 'Unable to search members.'))
    } finally {
      setSearching(false)
    }
  }

  const addMember = async (userId) => {
    setError('')
    setNotice('')
    setAddingId(userId)
    try {
      const url = isHomecell ? `/homecells/${id}/members/` : `/ministries/${id}/members-manage/`
      await api.post(url, { user_id: userId })
      setNotice('Member added.')
      setSearchResults((prev) => prev.map((r) => (r.id === userId ? { ...r, already_enrolled: true } : r)))
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to add this member.'))
    } finally {
      setAddingId(null)
    }
  }

  const startEdit = (member) => {
    setEditingId(member.user_id)
    setEditForm({ first_name: member.first_name || '', last_name: member.last_name || '', phone: member.phone || '' })
  }

  const memberDetailUrl = (userId) =>
    isHomecell ? `/homecells/${id}/members/${userId}/` : `/ministries/${id}/members-manage/${userId}/`

  const saveEdit = async (userId) => {
    setError('')
    setNotice('')
    setSavingEdit(true)
    try {
      await api.patch(memberDetailUrl(userId), editForm)
      setNotice('Member updated.')
      setEditingId(null)
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to update this member.'))
    } finally {
      setSavingEdit(false)
    }
  }

  const removeMember = async (userId) => {
    if (!confirm('Remove this member from the department?')) return
    setError('')
    setNotice('')
    setRemovingId(userId)
    try {
      await api.delete(memberDetailUrl(userId))
      setNotice('Member removed.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to remove this member.'))
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <MinistryGuard ministryId={id}>
      <div className="container py-10">
        <MinistryConsoleNav ministryId={id} ministryName={ministry?.ministry_name} />

        {notice && <div className="p-4 mb-6 bg-green-100 text-green-800 rounded-2xl">{notice}</div>}
        {error && <div className="p-4 mb-6 bg-red-100 text-red-800 rounded-2xl">{error}</div>}

        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add Member</h2>
          <form onSubmit={runSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Search by name, username, or email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
            />
            <button disabled={searching} type="submit" className="rounded-xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
              {searching ? 'Searching…' : 'Search'}
            </button>
          </form>
          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5">
                  <div>
                    <span className="font-medium">{`${r.first_name || ''} ${r.last_name || ''}`.trim() || r.username}</span>
                    <span className="ml-2 text-slate-500 text-sm">{r.email}</span>
                  </div>
                  {r.already_enrolled ? (
                    <span className="text-xs font-semibold text-slate-400">Already a member</span>
                  ) : (
                    <button
                      disabled={addingId === r.id}
                      onClick={() => addMember(r.id)}
                      className="rounded-full bg-slate-900 text-white px-4 py-1.5 text-xs font-semibold disabled:opacity-60"
                    >
                      {addingId === r.id ? 'Adding…' : 'Add'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {!isHomecell && (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 mb-6">
            <h2 className="text-xl font-semibold mb-4">Pending Join Requests ({joinRequests.length})</h2>
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
        )}

        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Members</h2>
            <span className="text-sm text-slate-500">{members.length} enrolled</span>
          </div>

          {loading && <div className="text-slate-600">Loading…</div>}

          {!loading && members.length === 0 && (
            <div className="text-slate-600">No members have enrolled in this department yet.</div>
          )}

          {!loading && members.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Joined</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const isEditing = editingId === m.user_id
                    return (
                      <tr key={m.id} className="border-b border-slate-100 align-top">
                        {isEditing ? (
                          <>
                            <td className="py-3 pr-4">
                              <div className="flex gap-1">
                                <input
                                  value={editForm.first_name}
                                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                  placeholder="First name"
                                  className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                                />
                                <input
                                  value={editForm.last_name}
                                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                  placeholder="Last name"
                                  className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                                />
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-slate-400">{m.email || '—'}</td>
                            <td className="py-3 pr-4">
                              <input
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                placeholder="Phone"
                                className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                              />
                            </td>
                            <td className="py-3 pr-4">{m.role || '—'}</td>
                            <td className="py-3 pr-4">{m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}</td>
                            <td className="py-3 pr-4">
                              <div className="flex gap-2">
                                <button
                                  disabled={savingEdit}
                                  onClick={() => saveEdit(m.user_id)}
                                  className="rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-semibold disabled:opacity-60"
                                >
                                  {savingEdit ? 'Saving…' : 'Save'}
                                </button>
                                <button onClick={() => setEditingId(null)} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold">
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 pr-4 font-medium">{`${m.first_name || ''} ${m.last_name || ''}`.trim() || '—'}</td>
                            <td className="py-3 pr-4">{m.email || '—'}</td>
                            <td className="py-3 pr-4">{m.phone || '—'}</td>
                            <td className="py-3 pr-4">{m.role || '—'}</td>
                            <td className="py-3 pr-4">{m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}</td>
                            <td className="py-3 pr-4">
                              <div className="flex gap-2">
                                <button onClick={() => startEdit(m)} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold">
                                  Edit
                                </button>
                                <button
                                  disabled={removingId === m.user_id}
                                  onClick={() => removeMember(m.user_id)}
                                  className="rounded-full border border-red-300 text-red-600 px-3 py-1 text-xs font-semibold disabled:opacity-60"
                                >
                                  {removingId === m.user_id ? 'Removing…' : 'Remove'}
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MinistryGuard>
  )
}
