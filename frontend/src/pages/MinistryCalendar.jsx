import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'
import MinistryGuard from '../components/MinistryGuard'
import MinistryConsoleNav from '../components/MinistryConsoleNav'
import MinistryComingSoon from '../components/MinistryComingSoon'

export default function MinistryCalendar() {
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
          title="Calendar"
          description="A combined calendar view of this department's events and attendance sessions is planned for a future update. In the meantime, use the Events and Attendance tabs."
        />
      </div>
    </MinistryGuard>
  )
}
