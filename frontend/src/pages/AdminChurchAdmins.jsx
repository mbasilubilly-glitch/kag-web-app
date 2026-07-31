import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import useAuth from '../hooks/useAuth'
import { extractErrorMessage } from '../utils/errors'

const STATUS_STYLES = {
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-slate-300 text-slate-800',
}

const EMPTY_FORM = { username: '', email: '', first_name: '', last_name: '', phone: '', password: '' }
const MAX_CHURCH_ADMINS = 4
const readableError = (err, fallback) => extractErrorMessage(err, fallback, { fields: ['username', 'email'] })

export default function AdminChurchAdmins() {
  const { isSuperAdmin } = useAuth()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [creating, setCreating] = useState(false)
  const [actionBusy, setActionBusy] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/admin/church-admins/')
      .then((res) => setAdmins(res.data || []))
      .catch((err) => setError(readableError(err, 'Unable to load Church Administrators. Only the Super Administrator can view this page.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setCreating(true)
    try {
      const res = await api.post('/admin/church-admins/', form)
      setNotice(res.data?.detail || 'Church Administrator created.')
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to create Church Administrator.'))
    } finally {
      setCreating(false)
    }
  }

  const changeStatus = async (userId, newStatus, confirmMessage) => {
    if (confirmMessage && !confirm(confirmMessage)) return
    setError('')
    setNotice('')
    setActionBusy(userId)
    try {
      await api.post('/profiles/approval/', { user_id: userId, status: newStatus })
      setNotice(`Status updated to ${newStatus}.`)
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to update status.'))
    } finally {
      setActionBusy(null)
    }
  }

  const resetPassword = async (userId) => {
    if (!confirm("Reset this Church Administrator's password and email them a temporary one?")) return
    setError('')
    setNotice('')
    setActionBusy(userId)
    try {
      const res = await api.post(`/users/${userId}/reset-password/`)
      setNotice(res.data?.detail || 'Password reset and emailed.')
    } catch (err) {
      setError(readableError(err, 'Unable to reset password.'))
    } finally {
      setActionBusy(null)
    }
  }

  const removeAdmin = async (userId) => {
    if (!confirm('Delete this Church Administrator account? This cannot be undone.')) return
    setError('')
    setNotice('')
    setActionBusy(userId)
    try {
      await api.delete(`/users/${userId}/`)
      setNotice('Church Administrator account deleted.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to delete account.'))
    } finally {
      setActionBusy(null)
    }
  }

  const atLimit = admins.length >= MAX_CHURCH_ADMINS

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Church Administrators</h1>
          <p className="text-slate-600 mt-2">
            Only the Super Administrator can create, suspend, reactivate, delete, or reset the password of a
            Church Administrator account.
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${atLimit ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
          {admins.length} / {MAX_CHURCH_ADMINS} used
        </span>
      </div>

      {error && <div className="rounded-3xl bg-red-100 p-6 text-red-800">{error}</div>}
      {notice && <div className="rounded-3xl bg-green-100 p-6 text-green-800">{notice}</div>}

      {atLimit && (
        <div className="rounded-3xl bg-amber-50 border border-amber-200 p-6 text-amber-800">
          Maximum of {MAX_CHURCH_ADMINS} Church Administrators reached. Delete an existing one below before creating another.
        </div>
      )}

      {isSuperAdmin && (
      <form onSubmit={handleCreate} className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-xl font-semibold">Add Church Administrator</h2>
        <fieldset disabled={atLimit} className="contents">
          <div className="grid md:grid-cols-2 gap-4">
            <label>
              <span className="text-slate-700 text-sm">Username</span>
              <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 disabled:bg-slate-50" />
            </label>
            <label>
              <span className="text-slate-700 text-sm">Email</span>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 disabled:bg-slate-50" />
            </label>
            <label>
              <span className="text-slate-700 text-sm">First name</span>
              <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 disabled:bg-slate-50" />
            </label>
            <label>
              <span className="text-slate-700 text-sm">Last name</span>
              <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 disabled:bg-slate-50" />
            </label>
            <label>
              <span className="text-slate-700 text-sm">Phone</span>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 disabled:bg-slate-50" />
            </label>
            <label>
              <span className="text-slate-700 text-sm">Password (optional)</span>
              <input
                type="text"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Leave blank to auto-generate one"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 disabled:bg-slate-50"
              />
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Set a password above, or leave it blank to auto-generate one — either way it's emailed to the new
            administrator, who can change it later from their own Profile page once signed in.
          </p>
          <button disabled={creating || atLimit} type="submit" className="mt-4 rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60">
            {creating ? 'Creating…' : atLimit ? 'Limit Reached' : 'Create Church Administrator'}
          </button>
        </fieldset>
      </form>
      )}

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold mb-4">Existing Church Administrators</h2>
        {loading ? (
          <div className="text-slate-500">Loading…</div>
        ) : admins.length === 0 ? (
          <div className="text-slate-500 text-sm">No Church Administrators yet.</div>
        ) : (
          <div className="grid gap-4">
            {admins.map((admin) => {
              const status = admin.profile?.status || 'ACTIVE'
              const busy = actionBusy === admin.id
              return (
                <div key={admin.id} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{admin.first_name} {admin.last_name} <span className="text-slate-500 font-normal">({admin.username})</span></h3>
                      <p className="text-slate-600 text-sm">{admin.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-800'}`}>{status}</span>
                      {isSuperAdmin && (
                        <>
                          {status === 'ACTIVE' ? (
                            <button disabled={busy} onClick={() => changeStatus(admin.id, 'SUSPENDED', 'Suspend this Church Administrator?')} className="rounded-full bg-slate-700 text-white px-4 py-1.5 text-sm font-semibold disabled:opacity-60">Suspend</button>
                          ) : (
                            <button disabled={busy} onClick={() => changeStatus(admin.id, 'ACTIVE', 'Reactivate this Church Administrator?')} className="rounded-full bg-green-600 text-white px-4 py-1.5 text-sm font-semibold disabled:opacity-60">Reactivate</button>
                          )}
                          <button disabled={busy} onClick={() => resetPassword(admin.id)} className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold disabled:opacity-60">Reset Password</button>
                          <Link to={`/admin/users/${admin.id}`} className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold">Edit</Link>
                          <button disabled={busy} onClick={() => removeAdmin(admin.id)} className="rounded-full bg-red-500/15 text-red-700 px-4 py-1.5 text-sm font-semibold hover:bg-red-500/25 disabled:opacity-60">Delete</button>
                        </>
                      )}
                    </div>
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
