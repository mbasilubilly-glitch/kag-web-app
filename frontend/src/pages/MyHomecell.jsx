import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function MyHomecell() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [homecell, setHomecell] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')

    api.get('/member-departments/snapshot/')
      .then(async (res) => {
        const myHomecell = res.data?.homecell
        if (!myHomecell?.id) {
          if (mounted) setHomecell(null)
          return
        }
        const detail = await api.get(`/ministries/${myHomecell.id}/`)
        if (mounted) setHomecell(detail.data)
      })
      .catch(() => {
        if (mounted) setError('Unable to load your homecell.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div className="container py-10">
        <div className="rounded-3xl bg-slate-100 p-10 text-center text-slate-600">Loading…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="rounded-3xl bg-red-100 p-8 text-red-800">{error}</div>
      </div>
    )
  }

  if (!homecell) {
    return (
      <div className="container py-10">
        <div className="rounded-3xl bg-white p-8 shadow-sm text-center">
          <div className="text-4xl mb-3">🏠</div>
          <h1 className="text-2xl font-bold mb-2">No homecell selected yet</h1>
          <p className="text-slate-600 mb-6">Choose your homecell to see its meeting details here.</p>
          <Link to="/departments" className="inline-block rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold">
            Select a Homecell
          </Link>
        </div>
      </div>
    )
  }

  const infoRows = [
    ['Meeting Day', homecell.meeting_day],
    ['Meeting Time', homecell.meeting_time],
    ['Meeting Venue', homecell.meeting_venue],
    ['Physical Address', homecell.physical_address],
    ['Area/Location', homecell.area_location],
    ['County', homecell.county],
    ['Church Branch', homecell.church_branch],
    ['Contact Phone', homecell.contact_phone],
    ['Contact Email', homecell.contact_email],
  ].filter(([, value]) => value)

  return (
    <div className="container py-10 space-y-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-500 mb-1">My Homecell</p>
        <h1 className="text-3xl font-bold">{homecell.ministry_name}</h1>
        {homecell.description && <p className="text-slate-600 mt-2">{homecell.description}</p>}

        {infoRows.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            {infoRows.map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
                <div className="text-slate-800 mt-1">{value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Link to="/departments" className="text-primary-600 font-semibold hover:underline">Change my homecell →</Link>
        </div>
      </div>
    </div>
  )
}
