import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { extractErrorMessage as readableError } from '../utils/errors'
import Avatar from '../components/Avatar'

export default function AdminMembershipRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    setError('')
    api.get('/membership-upgrade/requests/')
      .then((res) => setRequests(res.data?.results || res.data || []))
      .catch((err) => setError(readableError(err, 'Unable to load membership requests.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const decide = async (userId, decision) => {
    setError('')
    setNotice('')
    setBusyId(userId)
    try {
      await api.post(`/membership-upgrade/requests/${userId}/decision/`, { status: decision })
      setNotice(decision === 'APPROVED' ? 'Membership request approved.' : 'Membership request rejected.')
      setRequests((prev) => prev.filter((u) => u.id !== userId))
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
          <h1 className="text-3xl font-bold">Membership Requests</h1>
          <p className="text-slate-600 mt-2">
            Visitors who have asked to become full Members. Approving updates their role immediately;
            rejecting lets them stay a Visitor and request again later.
          </p>
        </div>
        <Link to="/admin/users" className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold">Manage Users</Link>
      </div>

      {error && <div className="rounded-3xl bg-red-100 p-6 text-red-800">{error}</div>}
      {notice && <div className="rounded-3xl bg-green-100 p-6 text-green-800">{notice}</div>}

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        {loading ? (
          <div className="text-slate-500">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="text-slate-500 text-sm">No pending membership requests.</div>
        ) : (
          <div className="grid gap-3">
            {requests.map((u) => (
              <div key={u.id} className="rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={u.profile?.profile_picture || u.profile?.profile_image}
                    name={`${u.first_name || ''} ${u.last_name || ''}` || u.username}
                    size={44}
                  />
                  <div>
                    <h3 className="text-lg font-semibold">{u.first_name} {u.last_name} <span className="text-slate-500 font-normal">({u.username})</span></h3>
                    <p className="text-slate-600 text-sm">
                      {u.email}
                      {u.profile?.membership_upgrade_requested_at && (
                        <> · Requested {new Date(u.profile.membership_upgrade_requested_at).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button disabled={busyId === u.id} onClick={() => decide(u.id, 'APPROVED')} className="rounded-full bg-green-500/15 text-green-700 px-4 py-1.5 text-sm font-semibold hover:bg-green-500/25 disabled:opacity-60">Approve</button>
                  <button disabled={busyId === u.id} onClick={() => decide(u.id, 'REJECTED')} className="rounded-full bg-red-500/15 text-red-700 px-4 py-1.5 text-sm font-semibold hover:bg-red-500/25 disabled:opacity-60">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
