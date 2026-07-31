import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import api from '../api'
import useAuth from '../hooks/useAuth'

/**
 * Gates access to a ministry's admin console to church admins and to
 * Department Administrators assigned to that specific ministry. Unlike
 * ProtectedRoute (which has no access to route params), this is rendered
 * inside each ministry console page, so it can check the :id itself.
 */
export default function MinistryGuard({ ministryId, children }) {
  const { isAdmin } = useAuth()
  const [status, setStatus] = useState(isAdmin ? 'allowed' : 'checking')

  useEffect(() => {
    if (isAdmin) return
    let mounted = true
    api.get('/department-admin-assignments/mine/')
      .then((res) => {
        if (!mounted) return
        const assigned = (res.data || []).some((a) => String(a.department?.id) === String(ministryId))
        setStatus(assigned ? 'allowed' : 'denied')
      })
      .catch(() => {
        if (mounted) setStatus('denied')
      })
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ministryId])

  if (status === 'checking') {
    return <div className="container py-10">Checking access…</div>
  }
  if (status === 'denied') {
    return <Navigate to="/dashboard" replace />
  }
  return children
}
