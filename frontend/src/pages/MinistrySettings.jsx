import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'
import MinistryGuard from '../components/MinistryGuard'
import MinistryConsoleNav from '../components/MinistryConsoleNav'
import MinistryComingSoon from '../components/MinistryComingSoon'

export default function MinistrySettings() {
  const { id } = useParams()
  const [ministry, setMinistry] = useState(null)

  useEffect(() => {
    let mounted = true
    api.get(`/ministries/${id}/`).then((res) => { if (mounted) setMinistry(res.data) }).catch(() => {})
    return () => { mounted = false }
  }, [id])

  return (
    <MinistryGuard ministryId={id}>
      <div className="container py-10">
        <MinistryConsoleNav ministryId={id} ministryName={ministry?.ministry_name} />
        <MinistryComingSoon
          title="Settings"
          description="Department-level settings (name, description, leader, team roles) are currently edited by a Church Administrator under Admin → Ministries. Self-service editing here is planned for a future update."
        />
      </div>
    </MinistryGuard>
  )
}
