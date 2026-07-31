import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'
import MinistryGuard from '../components/MinistryGuard'
import MinistryConsoleNav from '../components/MinistryConsoleNav'
import MinistryComingSoon from '../components/MinistryComingSoon'

export default function MinistryPrayerRequests() {
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
          title="Prayer Requests"
          description="Routing prayer requests to a specific department (rather than the single church-wide inbox) requires a data model change and is planned for a future update."
        />
      </div>
    </MinistryGuard>
  )
}
