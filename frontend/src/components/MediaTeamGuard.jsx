import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import api from '../api'
import useAuth from '../hooks/useAuth'

/**
 * Gates access to the Media Team's own pages to church admins and to
 * whoever is assigned as the Media Team's Leader/Assistant Leader (via
 * DepartmentAdminAssignment against the seeded "Media Team" ministry -
 * same mechanism as every other department). Mirrors MinistryGuard, but
 * looks the assignment up by ministry name instead of a route :id, since
 * there's only one Media Team and its pages aren't parameterized.
 *
 * requireLeader=false (used for the dashboard, not /manage) also lets in
 * any approved+active Media Team roster member, not just the Leader/
 * Assistant Leader - matching the same is_media_team() check the backend
 * already uses to gate sermons/events/galleries/livestream writes, so
 * every roster member can actually reach the hub linking to those tools.
 */
export default function MediaTeamGuard({ children, requireLeader = true }) {
  const { isAdmin } = useAuth()
  const [status, setStatus] = useState(isAdmin ? 'allowed' : 'checking')

  useEffect(() => {
    if (isAdmin) return
    let mounted = true

    const checks = [api.get('/department-admin-assignments/mine/')]
    if (!requireLeader) checks.push(api.get('/media-team/mine/'))

    Promise.all(checks.map((p) => p.catch(() => null)))
      .then(([assignmentsRes, membershipRes]) => {
        if (!mounted) return
        const isLeader = (assignmentsRes?.data || []).some((a) => a.department?.ministry_name === 'Media Team')
        const isRosterMember = !requireLeader && membershipRes?.data?.status === 'APPROVED' && membershipRes?.data?.is_active
        setStatus(isLeader || isRosterMember ? 'allowed' : 'denied')
      })
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'checking') {
    return <div className="container py-10">Checking access…</div>
  }
  if (status === 'denied') {
    return <Navigate to="/dashboard" replace />
  }
  return children
}
