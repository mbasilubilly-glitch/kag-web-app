import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'
import MinistryGuard from '../components/MinistryGuard'
import MinistryConsoleNav from '../components/MinistryConsoleNav'
import MinistryComingSoon from '../components/MinistryComingSoon'

export default function MinistryResources() {
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
          title="Resources"
          description="File and resource uploads for department leaders (guides, templates, media) are planned for a future update."
        />
      </div>
    </MinistryGuard>
  )
}
