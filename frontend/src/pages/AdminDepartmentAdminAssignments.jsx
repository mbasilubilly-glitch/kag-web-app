import { useEffect, useMemo, useState } from 'react'
import api from '../api'

function uniq(arr) {
  return Array.from(new Set(arr))
}

export default function AdminDepartmentAdminAssignments() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [departments, setDepartments] = useState([])
  const [churchAdmins, setChurchAdmins] = useState([]) // Admin candidates

  const [selectedDepartmentId, setSelectedDepartmentId] = useState('')
  const [selectedAdminUserId, setSelectedAdminUserId] = useState('')

  const [currentAssignments, setCurrentAssignments] = useState([])

  const EMPTY_NEW_ADMIN_FORM = { username: '', email: '', first_name: '', last_name: '', phone: '' }
  const [newAdminForm, setNewAdminForm] = useState(EMPTY_NEW_ADMIN_FORM)
  const [creatingAdmin, setCreatingAdmin] = useState(false)

  const currentDepartment = useMemo(
    () => departments.find((d) => String(d.id) === String(selectedDepartmentId)) || null,
    [departments, selectedDepartmentId]
  )

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const [departmentsRes, usersRes] = await Promise.all([
          api.get('/ministries/'),
          // /users/ is paginated - page_size=100 is a stopgap so this
          // candidate list still resembles "everyone" up to 100 users;
          // beyond that this needs a real search picker (see roadmap).
          api.get('/users/?page_size=100'),
        ])

        if (!mounted) return

        setDepartments(departmentsRes.data || [])

        // Any existing member/visitor can be picked here, not just users
        // already holding Administrator/Pastor - assigning them promotes
        // them to Administrator as part of the same request (see
        // DepartmentAdminAssignmentCreateView). Requiring them to already
        // be an admin would make that promotion path unreachable, since
        // this dropdown is the only way to pick an existing user.
        const users = usersRes.data?.results || []
        const candidates = users.filter((u) => !!u?.profile)

        setChurchAdmins(candidates)

        // Default select first department
        const firstDept = departmentsRes.data?.[0]
        if (firstDept?.id) setSelectedDepartmentId(String(firstDept.id))
      } catch (e) {
        if (!mounted) return
        setError('Unable to load departments/admin candidates.')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const loadAssignments = async (deptId) => {
    if (!deptId) {
      setCurrentAssignments([])
      return
    }

    try {
      const res = await api.get(`/department-admin-assignments/departments/${deptId}/`)
      setCurrentAssignments(res.data || [])
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Unable to load assignments.')
    }
  }

  useEffect(() => {
    if (!selectedDepartmentId) return
    loadAssignments(selectedDepartmentId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepartmentId])

  const refreshAssignments = async () => {
    await loadAssignments(selectedDepartmentId)
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    setError('')

    if (!selectedDepartmentId) {
      setError('Select a department.')
      return
    }

    if (!selectedAdminUserId) {
      setError('Select a department administrator user.')
      return
    }

    try {
      await api.post('/department-admin-assignments/', {
        department_id: Number(selectedDepartmentId),
        admin_user_id: Number(selectedAdminUserId),
      })

      setSelectedAdminUserId('')
      await refreshAssignments()
      alert('Department administrator assigned successfully.')
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.admin_user_id?.[0] || err?.message || 'Unable to assign admin.')
    }
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    setError('')

    if (!selectedDepartmentId) {
      setError('Select a department.')
      return
    }

    setCreatingAdmin(true)
    try {
      await api.post('/department-admin-assignments/create-account/', {
        department_id: Number(selectedDepartmentId),
        ...newAdminForm,
      })

      setNewAdminForm(EMPTY_NEW_ADMIN_FORM)
      await refreshAssignments()
      alert('Department Administrator account created and assigned. A temporary password has been emailed to them.')
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.username?.[0] || err?.response?.data?.email?.[0] || err?.message || 'Unable to create Department Administrator.')
    } finally {
      setCreatingAdmin(false)
    }
  }

  const handleRemove = async (assignmentId) => {
    setError('')
    try {
      await api.delete(`/department-admin-assignments/${assignmentId}/`)
      await refreshAssignments()
      alert('Assignment removed.')
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Unable to remove assignment.')
    }
  }

  const assignedAdminUserIds = useMemo(() => {
    return uniq((currentAssignments || []).map((a) => String(a.admin_user_id || a.admin?.id || ''))).filter(Boolean)
  }, [currentAssignments])

  const availableAdmins = useMemo(() => {
    // Avoid duplicate assignment within same department (UI-level)
    return (churchAdmins || []).filter((u) => !assignedAdminUserIds.includes(String(u.id)))
  }, [churchAdmins, assignedAdminUserIds])

  return (
    <div className="container py-10 space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Assign Department Administrators</h1>
        <p className="text-slate-600 mt-2">Church Admins can assign and manage Department Admins for departments they operate.</p>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-slate-100 p-10 text-center text-slate-600">Loading…</div>
      ) : (
        <>
          {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}

          <form onSubmit={handleAssign} className="space-y-6">
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Select Department</h2>
              <label className="block">
                <span className="text-slate-700">Department</span>
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 bg-white"
                >
                  <option value="">-- Choose --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.ministry_name || d.name || `Department #${d.id}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Assign Department Admin</h2>

              <label className="block">
                <span className="text-slate-700">Department Administrator</span>
                <select
                  value={selectedAdminUserId}
                  onChange={(e) => setSelectedAdminUserId(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 bg-white"
                >
                  <option value="">-- Choose --</option>
                  {availableAdmins.map((u) => (
                    <option key={u.id} value={String(u.id)}>
                      {u.username} ({u.profile?.role})
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-4 flex items-center gap-3">
                <button type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold">
                  Assign Admin
                </button>
              </div>
            </div>
          </form>

          <form onSubmit={handleCreateAdmin} className="rounded-3xl bg-white p-8 shadow-sm space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">Create New Department Administrator</h2>
              <p className="text-slate-600 mt-1 text-sm">
                Create a brand-new account and assign it to the department selected above, instead of picking
                from existing users.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <label>
                <span className="text-slate-700 text-sm">Username</span>
                <input required value={newAdminForm.username} onChange={(e) => setNewAdminForm({ ...newAdminForm, username: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
              </label>
              <label>
                <span className="text-slate-700 text-sm">Email</span>
                <input required type="email" value={newAdminForm.email} onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
              </label>
              <label>
                <span className="text-slate-700 text-sm">First name</span>
                <input value={newAdminForm.first_name} onChange={(e) => setNewAdminForm({ ...newAdminForm, first_name: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
              </label>
              <label>
                <span className="text-slate-700 text-sm">Last name</span>
                <input value={newAdminForm.last_name} onChange={(e) => setNewAdminForm({ ...newAdminForm, last_name: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
              </label>
              <label>
                <span className="text-slate-700 text-sm">Phone</span>
                <input value={newAdminForm.phone} onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
              </label>
            </div>
            <p className="text-xs text-slate-500">A temporary password is generated automatically and emailed to the new administrator.</p>
            <button disabled={creatingAdmin} type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60">
              {creatingAdmin ? 'Creating…' : 'Create & Assign'}
            </button>
          </form>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Current Assignments</h2>
            {currentDepartment ? (
              <div className="text-sm text-slate-600 mb-4">Department: {currentDepartment.ministry_name || currentDepartment.name}</div>
            ) : (
              <div className="text-sm text-slate-600 mb-4">Select a department to view assignments.</div>
            )}

            {(!currentAssignments || currentAssignments.length === 0) && (
              <div className="text-slate-500">No department admins assigned yet.</div>
            )}

            {currentAssignments && currentAssignments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="text-slate-600">
                      <th className="py-3 px-2 font-semibold">Admin</th>
                      <th className="py-3 px-2 font-semibold">Role</th>
                      <th className="py-3 px-2 font-semibold">Assigned</th>
                      <th className="py-3 px-2 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentAssignments.map((a) => (
                      <tr key={a.id} className="border-t border-slate-200">
                        <td className="py-3 px-2">
                          {a.admin?.username || `User #${a.admin_user_id}`}
                        </td>
                        <td className="py-3 px-2">{a.admin?.profile?.role || '-'}</td>
                        <td className="py-3 px-2 text-slate-600">{a.created_at ? new Date(a.created_at).toLocaleString() : '-'}</td>
                        <td className="py-3 px-2">
                          <button
                            type="button"
                            onClick={() => handleRemove(a.id)}
                            className="rounded-full bg-red-500/15 text-red-700 px-4 py-2 text-sm font-semibold hover:bg-red-500/25"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

