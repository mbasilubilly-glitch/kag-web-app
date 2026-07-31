import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

const ROLE_OPTIONS = ['All', 'Member', 'Visitor', 'Ministry Leader', 'Pastor', 'Administrator']
const STATUS_OPTIONS = ['All', 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'DISABLED', 'LOCKED']

const STATUS_STYLES = {
  ACTIVE: 'bg-green-100 text-green-800',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
  REJECTED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-slate-300 text-slate-800',
  DISABLED: 'bg-slate-300 text-slate-800',
  LOCKED: 'bg-red-100 text-red-800',
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

export default function AdminMembershipList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [pageInfo, setPageInfo] = useState({ count: 0, next: null, previous: null })

  const load = (url) => {
    setLoading(true)
    setError('')
    const requestUrl = url || (() => {
      const params = new URLSearchParams({ page_size: '25' })
      if (search) params.set('search', search)
      if (roleFilter !== 'All') params.set('role', roleFilter)
      if (statusFilter !== 'All') params.set('status', statusFilter)
      return `/users/?${params.toString()}`
    })()

    api.get(requestUrl)
      .then((res) => {
        setUsers(res.data.results || [])
        setPageInfo({ count: res.data.count, next: res.data.next, previous: res.data.previous })
      })
      .catch(() => setError('Unable to load the membership list. Only Super Admins and Church Admins can view this page.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, roleFilter, statusFilter])

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold">Membership List</h1>
        <p className="text-slate-600 mt-1 text-sm">
          Every user who has registered with the system, with their full registration details. {users.length} of {pageInfo.count} shown.
        </p>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-800 rounded-2xl">{error}</div>}

      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search name, email, phone, member #…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm">
          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm">
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-10 text-center text-slate-500">Loading…</div>
      ) : users.length === 0 ? (
        <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-10 text-center text-slate-500">No members match this search/filter.</div>
      ) : (
        <>
          {/* Below lg: a card per member - a 16-column table has no readable
              way to fit a phone screen even with horizontal scroll, so this
              is a genuinely different layout, not just a squeezed table. */}
          <div className="grid gap-3 lg:hidden">
            {users.map((u) => {
              const p = u.profile || {}
              const status = p.status || 'PENDING_APPROVAL'
              const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username
              return (
                <Link
                  key={u.id}
                  to={`/admin/users/${u.id}`}
                  className="block rounded-3xl bg-white shadow-sm border border-slate-100 p-4 hover:border-primary-200 transition"
                >
                  <div className="flex items-center gap-3">
                    {p.profile_picture ? (
                      <img src={p.profile_picture} alt="" className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm shrink-0">
                        {fullName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 truncate">{fullName}</div>
                      <div className="text-slate-500 text-xs truncate">@{u.username}</div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-800'}`}>
                      {status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 text-xs">
                    <div className="min-w-0">
                      <dt className="text-slate-400">Phone</dt>
                      <dd className="text-slate-700 truncate">{p.phone || '—'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-slate-400">Email</dt>
                      <dd className="text-slate-700 truncate">{u.email || '—'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-slate-400">Department/Ministry</dt>
                      <dd className="text-slate-700 truncate">{u.ministries?.length ? u.ministries.join(', ') : '—'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-slate-400">Cell Group</dt>
                      <dd className="text-slate-700 truncate">{u.cell_group || '—'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-slate-400">Registered</dt>
                      <dd className="text-slate-700 truncate">{formatDate(u.date_joined)}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-slate-400">Location</dt>
                      <dd className="text-slate-700 truncate">{[p.town_city, p.county].filter(Boolean).join(', ') || '—'}</dd>
                    </div>
                  </dl>
                </Link>
              )
            })}
          </div>

          {/* lg and up: the full table. */}
          <div className="hidden lg:block rounded-3xl bg-white shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50">
                    <th className="py-3 px-4 font-semibold">#</th>
                    <th className="py-3 px-4 font-semibold">Full Name</th>
                    <th className="py-3 px-4 font-semibold">National ID/Passport Number</th>
                    <th className="py-3 px-4 font-semibold">Phone Number</th>
                    <th className="py-3 px-4 font-semibold">Email Address</th>
                    <th className="py-3 px-4 font-semibold">Gender</th>
                    <th className="py-3 px-4 font-semibold">Marital Status</th>
                    <th className="py-3 px-4 font-semibold">Department/Ministry</th>
                    <th className="py-3 px-4 font-semibold">Cell Group</th>
                    <th className="py-3 px-4 font-semibold">Membership Status</th>
                    <th className="py-3 px-4 font-semibold">Baptism Status</th>
                    <th className="py-3 px-4 font-semibold">Confirmation Status</th>
                    <th className="py-3 px-4 font-semibold">Registration Date</th>
                    <th className="py-3 px-4 font-semibold">County</th>
                    <th className="py-3 px-4 font-semibold">Town/City</th>
                    <th className="py-3 px-4 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, index) => {
                    const p = u.profile || {}
                    const status = p.status || 'PENDING_APPROVAL'
                    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username
                    return (
                      <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-500">{index + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {p.profile_picture ? (
                              <img src={p.profile_picture} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs">
                                {fullName.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-slate-900">{fullName}</div>
                              <div className="text-slate-500 text-xs">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{p.national_id || '—'}</td>
                        <td className="py-3 px-4 text-slate-600">{p.phone || '—'}</td>
                        <td className="py-3 px-4 text-slate-600">{u.email || '—'}</td>
                        <td className="py-3 px-4 text-slate-600">{p.gender || '—'}</td>
                        <td className="py-3 px-4 text-slate-600">{p.marital_status || '—'}</td>
                        <td className="py-3 px-4 text-slate-600">{u.ministries?.length ? u.ministries.join(', ') : '—'}</td>
                        <td className="py-3 px-4 text-slate-600">{u.cell_group || '—'}</td>
                        <td className="py-3 px-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-800'}`}>
                            {status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{p.baptized ? '✓' : '—'}</td>
                        <td className="py-3 px-4 text-slate-600">{p.confirmed ? '✓' : '—'}</td>
                        <td className="py-3 px-4 text-slate-600">{formatDate(u.date_joined)}</td>
                        <td className="py-3 px-4 text-slate-600">{p.county || '—'}</td>
                        <td className="py-3 px-4 text-slate-600">{p.town_city || '—'}</td>
                        <td className="py-3 px-4">
                          <Link to={`/admin/users/${u.id}`} className="text-primary-600 hover:text-primary-800 font-semibold text-sm">View</Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

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
