import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { extractErrorMessage as readableError } from '../utils/errors'
import Avatar from '../components/Avatar'

export default function AdminUserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({ username: '', email: '', first_name: '', last_name: '' })
  const [profileForm, setProfileForm] = useState({ phone: '', role: 'Visitor' })
  const [initialRole, setInitialRole] = useState('Visitor')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [actionBusy, setActionBusy] = useState(false)

  const roles = ['Visitor', 'Member', 'Ministry Leader', 'Pastor', 'Administrator']

  const loadUser = () => {
    api.get(`/users/${id}/`)
      .then((res) => {
        setUser(res.data)
        setForm({
          username: res.data.username || '',
          email: res.data.email || '',
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || '',
        })
        setProfileForm({
          phone: res.data.profile?.phone || '',
          role: res.data.profile?.role || 'Visitor',
        })
        setInitialRole(res.data.profile?.role || 'Visitor')
        setStatus(res.data.profile?.status || 'PENDING_APPROVAL')
      })
      .catch(() => setError('Unable to load user'))
  }

  useEffect(() => {
    loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])


  const changeStatus = async (newStatus, confirmMessage) => {
    if (confirmMessage && !confirm(confirmMessage)) return
    setError('')
    setNotice('')
    setActionBusy(true)
    try {
      await api.post('/profiles/approval/', { user_id: id, status: newStatus })
      setStatus(newStatus)
      setNotice(`Status updated to ${newStatus}.`)
    } catch (err) {
      setError(readableError(err, 'Unable to update status.'))
    } finally {
      setActionBusy(false)
    }
  }

  const decideMembershipRequest = async (decision) => {
    setError('')
    setNotice('')
    setActionBusy(true)
    try {
      await api.post(`/membership-upgrade/requests/${id}/decision/`, { status: decision })
      setNotice(decision === 'APPROVED' ? 'Membership request approved — role updated to Member.' : 'Membership request rejected.')
      loadUser()
    } catch (err) {
      setError(readableError(err, 'Unable to decide this request.'))
    } finally {
      setActionBusy(false)
    }
  }

  const resetPassword = async () => {
    if (!confirm(`Reset this user's password and email them a temporary one?`)) return
    setError('')
    setNotice('')
    setActionBusy(true)
    try {
      const res = await api.post(`/users/${id}/reset-password/`)
      setNotice(res.data?.detail || 'Password reset and emailed to the user.')
    } catch (err) {
      setError(readableError(err, 'Unable to reset password.'))
    } finally {
      setActionBusy(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.put(`/users/${id}/`, form)
      // Phone lives on the profile endpoint; role changes go through the
      // audited role-patch endpoint so every change shows up in the audit log.
      await api.put(`/users/${id}/profile/`, { phone: profileForm.phone })
      if (profileForm.role !== initialRole) {
        await api.patch(`/users/${id}/role/`, { role: profileForm.role, reason: 'Changed via Admin Users' })
      }
      navigate('/admin/users')
    } catch (err) {
      setError(readableError(err, 'Save failed'))
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete user?')) return
    try {
      await api.delete(`/users/${id}/`)
      navigate('/admin/users')
    } catch {
      setError('Delete failed')
    }
  }

  if (!user) return <div className="container py-10">Loading user...</div>

  const statusStyles = {
    ACTIVE: 'bg-green-100 text-green-800',
    PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
    REJECTED: 'bg-red-100 text-red-800',
    SUSPENDED: 'bg-slate-300 text-slate-800',
  }

  return (
    <div className="container py-10">
      <div className="rounded-3xl bg-white p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <Avatar
              src={user.profile?.profile_picture || user.profile?.profile_image}
              name={`${user.first_name || ''} ${user.last_name || ''}` || user.username}
              size={64}
              className="ring-2 ring-slate-100"
            />
            <div>
              <h1 className="text-2xl font-bold">{user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : 'Edit User'}</h1>
              <p className="text-slate-600">User ID: {user.id}</p>
            </div>
          </div>
          <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${statusStyles[status] || 'bg-slate-100 text-slate-800'}`}>
            {status}
          </span>
        </div>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-800 rounded mb-4">{error}</div>}
      {notice && <div className="p-4 bg-slate-100 text-slate-800 rounded mb-4">{notice}</div>}

      {user.profile?.membership_upgrade_status === 'PENDING' && (
        <div className="rounded-3xl bg-amber-50 border-2 border-amber-300 p-6 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-amber-900">Requested to become a Member</h2>
            <p className="text-amber-800 text-sm">This Visitor has asked to be upgraded to Member.</p>
          </div>
          <div className="flex gap-3">
            <button disabled={actionBusy} onClick={() => decideMembershipRequest('APPROVED')} className="rounded-2xl bg-green-600 text-white px-5 py-2.5 font-semibold disabled:opacity-60">Approve</button>
            <button disabled={actionBusy} onClick={() => decideMembershipRequest('REJECTED')} className="rounded-2xl bg-red-600 text-white px-5 py-2.5 font-semibold disabled:opacity-60">Reject</button>
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 mb-6">
        <h2 className="text-lg font-semibold mb-3">Account Actions</h2>
        <div className="flex flex-wrap gap-3">
          {status === 'PENDING_APPROVAL' && (
            <>
              <button disabled={actionBusy} onClick={() => changeStatus('ACTIVE')} className="rounded-2xl bg-green-600 text-white px-5 py-2.5 font-semibold disabled:opacity-60">Approve</button>
              <button disabled={actionBusy} onClick={() => changeStatus('REJECTED')} className="rounded-2xl bg-red-600 text-white px-5 py-2.5 font-semibold disabled:opacity-60">Reject</button>
            </>
          )}
          {status === 'ACTIVE' && (
            <button disabled={actionBusy} onClick={() => changeStatus('SUSPENDED', 'Suspend this user? They will be immediately blocked from signing in.')} className="rounded-2xl bg-slate-700 text-white px-5 py-2.5 font-semibold disabled:opacity-60">Suspend</button>
          )}
          {status === 'SUSPENDED' && (
            <button disabled={actionBusy} onClick={() => changeStatus('ACTIVE', 'Reactivate this user? They will regain access immediately.')} className="rounded-2xl bg-green-600 text-white px-5 py-2.5 font-semibold disabled:opacity-60">Reactivate</button>
          )}
          <button disabled={actionBusy} onClick={resetPassword} className="rounded-2xl border border-slate-300 px-5 py-2.5 font-semibold disabled:opacity-60">Reset Password</button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid gap-4 max-w-2xl">
        <label>
          <span className="text-slate-700">Username</span>
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-2 w-full rounded-2xl border px-4 py-3" />
        </label>
        <label>
          <span className="text-slate-700">Email</span>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2 w-full rounded-2xl border px-4 py-3" />
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          <label>
            <span className="text-slate-700">First name</span>
            <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="mt-2 w-full rounded-2xl border px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700">Last name</span>
            <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="mt-2 w-full rounded-2xl border px-4 py-3" />
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label>
            <span className="text-slate-700">Phone</span>
            <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="mt-2 w-full rounded-2xl border px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700">Role</span>
            <select value={profileForm.role} onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })} className="mt-2 w-full rounded-2xl border px-4 py-3">
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3">Save</button>
          <button type="button" onClick={handleDelete} className="rounded-2xl border border-red-600 text-red-600 px-6 py-3">Delete</button>
        </div>
      </form>

      <div className="rounded-3xl bg-slate-100 p-6 shadow-sm mt-8">
        <h2 className="text-xl font-semibold">Profile</h2>
        <p className="text-slate-700">Phone: {profileForm.phone || 'Not set'}</p>
        <p className="text-slate-700">Role: {profileForm.role || 'Visitor'}</p>
      </div>
    </div>
  )
}
