import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import Avatar from '../components/Avatar'

const STATUS_STYLES = {
  ACTIVE: 'bg-green-100 text-green-800',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
  REJECTED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-slate-300 text-slate-800',
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [pageInfo, setPageInfo] = useState({ count: 0, next: null, previous: null })
  const [pendingCount, setPendingCount] = useState(0)

  const load = (url) => {
    setLoading(true)
    setError('')
    const requestUrl = url || (() => {
      const params = new URLSearchParams({ page_size: '25' })
      if (search) params.set('search', search)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      return `/users/?${params.toString()}`
    })()

    api.get(requestUrl)
      .then((response) => {
        setUsers(response.data.results || [])
        setPageInfo({ count: response.data.count, next: response.data.next, previous: response.data.previous })
      })
      .catch(() => setError('Unable to load users. Make sure you are an administrator.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, statusFilter])

  useEffect(() => {
    api.get('/dashboard-summary/').then((res) => setPendingCount(res.data?.pending_approvals || 0)).catch(() => {})
  }, [])

  return (
    <div className="container py-10 space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Users</h1>
          <p className="text-slate-600 mt-2">
            View registered members and their roles within the church platform.
            {pendingCount > 0 && <span className="ml-2 font-semibold text-amber-700">{pendingCount} awaiting approval.</span>}
          </p>
        </div>
        <Link to="/register" className="rounded-2xl bg-slate-900 text-white px-5 py-3 text-sm">Add New User</Link>
      </div>
      {error && <div className="rounded-3xl bg-red-100 p-6 text-red-800">{error}</div>}

      <div className="rounded-3xl bg-white p-6 shadow-sm border flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, username, email, phone, member #…"
          className="flex-1 min-w-[220px] rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
        />
        <span className="text-sm text-slate-500">{pageInfo.count} total</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {['ALL', 'PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${statusFilter === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {s === 'ALL' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-slate-500 text-sm">Loading…</div>
        ) : users.length === 0 ? (
          <div className="text-slate-500 text-sm">No users match this filter.</div>
        ) : (
          users.map((user) => {
            const status = user.profile?.status || 'PENDING_APPROVAL'
            return (
              <div key={user.id} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={user.profile?.profile_picture || user.profile?.profile_image}
                      name={`${user.first_name || ''} ${user.last_name || ''}`}
                      size={44}
                    />
                    <div>
                      <h2 className="text-xl font-semibold">{user.first_name} {user.last_name}</h2>
                      <p className="text-slate-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-800'}`}>{status.replace('_', ' ')}</span>
                    <div className="text-slate-700 text-sm">{user.profile?.role || 'Visitor'}</div>
                    <Link to={`/admin/users/${user.id}`} className="text-slate-700 hover:text-slate-900 font-semibold text-sm">Edit</Link>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {(pageInfo.next || pageInfo.previous) && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={!pageInfo.previous}
            onClick={() => load(pageInfo.previous)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            ← Previous
          </button>
          <button
            disabled={!pageInfo.next}
            onClick={() => load(pageInfo.next)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
