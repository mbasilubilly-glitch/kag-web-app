import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import useAuth from '../hooks/useAuth'

const WORSHIP_MINISTRY_NAME = 'Praise and Worship'

export default function Worship() {
  const { isAuthenticated } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [ministry, setMinistry] = useState(null)
  const [homecell, setHomecell] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [ministryStatuses, setMinistryStatuses] = useState({})

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    let mounted = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [ministriesRes, snapshotRes] = await Promise.all([
          api.get('/ministries/'),
          api.get('/member-departments/snapshot/'),
        ])
        if (!mounted) return

        const found = (ministriesRes.data || []).find((m) => m.ministry_name === WORSHIP_MINISTRY_NAME)
        const snapshotData = snapshotRes.data || {}

        setMinistry(found || null)
        setHomecell(snapshotData.homecell || null)
        setSelectedIds((snapshotData.selected_ministry_ids || []).map((x) => String(x)))
        setMinistryStatuses(snapshotData.selected_ministry_statuses || {})
      } catch (e) {
        if (!mounted) return
        setError('Unable to load the Worship Team right now.')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [isAuthenticated])

  const isSelected = ministry ? selectedIds.includes(String(ministry.id)) : false
  const status = ministry ? ministryStatuses[String(ministry.id)] : null

  const handleJoinToggle = async () => {
    setError('')
    setNotice('')

    if (!ministry) return
    if (!homecell?.id) {
      setError('Please set your homecell first in Departments before joining the Worship Team.')
      return
    }

    setSubmitting(true)
    try {
      const ministryId = String(ministry.id)
      const next = isSelected
        ? selectedIds.filter((x) => x !== ministryId)
        : [...selectedIds, ministryId]

      await api.post('/member-departments/register/', {
        homecell_id: Number(homecell.id),
        ministry_ids: next.map(Number),
      })

      const snapshotRes = await api.get('/member-departments/snapshot/')
      const snapshotData = snapshotRes.data || {}
      setSelectedIds((snapshotData.selected_ministry_ids || []).map((x) => String(x)))
      setMinistryStatuses(snapshotData.selected_ministry_statuses || {})
      setNotice(isSelected ? 'You have left the Worship Team.' : 'Request submitted — pending approval from the Worship Team admin.')
    } catch (e) {
      setError(e?.response?.data?.detail || 'Unable to update your Worship Team membership right now.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pb-10">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-white px-4 py-16 md:py-20">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-6 animate-fadeInUp">
            <span className="text-secondary-200 text-sm font-semibold">🎶 Worship Ministry</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fadeInUp-delay-1">
            Worship <span className="bg-gradient-to-r from-secondary-300 to-secondary-100 bg-clip-text text-transparent">at KAG Unity</span>
          </h1>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto animate-fadeInUp-delay-2">
            Learn about the Worship Ministry, upcoming worship gatherings, and how to join the team.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="container px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 mb-12">
          {/* Worship Resources */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition border-t-4 border-primary-600 transform hover:-translate-y-2 animate-slideInLeft">
            <div className="text-5xl mb-4">🎵</div>
            <h2 className="text-2xl font-bold text-primary-800 mb-4">Worship Resources</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Access worship videos, songs, and devotional resources designed to inspire and equip worship leaders,
              musicians, and congregants.
            </p>
            <div className="space-y-3">
              {[
                { icon: '🎤', label: 'Worship Song Archives', color: 'bg-primary-50 text-primary-700' },
                { icon: '🎸', label: 'Musician Resources', color: 'bg-accent-50 text-accent-700' },
                { icon: '📖', label: 'Devotional Materials', color: 'bg-secondary-50 text-secondary-700' },
              ].map((item) => (
                <div key={item.label} className={`flex items-center gap-3 p-3 rounded-xl ${item.color}`}>
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Join the Worship Team */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition border-t-4 border-secondary-500 animate-slideInRight">
            <div className="text-5xl mb-4">🙌</div>
            <h2 className="text-2xl font-bold text-primary-800 mb-4">Join the Worship Team</h2>
            <p className="text-gray-600 mb-6">
              Serve through music, sound, or media as part of the Worship Team. Joining is subject to
              approval by the Worship Team's admin/leader.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-danger-500/10 border border-danger-500/20 rounded-xl text-danger-700 flex items-center gap-3">
                <span>❌</span>
                <span className="font-medium">{error}</span>
              </div>
            )}
            {notice && (
              <div className="mb-6 p-4 bg-success-500/10 border border-success-500/20 rounded-xl text-success-700 flex items-center gap-3">
                <span>✅</span>
                <span className="font-medium">{notice}</span>
              </div>
            )}

            {!isAuthenticated ? (
              <div className="space-y-4">
                <p className="text-gray-700">Sign in to submit a request to join the Worship Team.</p>
                <Link
                  to="/signin"
                  className="inline-flex w-full items-center justify-center px-8 py-4 bg-gradient-hero text-white font-bold rounded-xl hover:shadow-lg transition"
                >
                  Sign In to Join
                </Link>
              </div>
            ) : loading ? (
              <div className="text-gray-500">Loading…</div>
            ) : !ministry ? (
              <div className="text-gray-500">The Worship Team is not set up yet. Please check back later.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleJoinToggle}
                    disabled={submitting}
                    className={`px-8 py-4 font-bold rounded-xl transition disabled:opacity-50 ${
                      isSelected ? 'bg-gray-200 text-gray-900' : 'bg-gradient-hero text-white hover:shadow-lg'
                    }`}
                  >
                    {submitting ? 'Saving…' : isSelected ? 'Leave Worship Team' : 'Request to Join'}
                  </button>

                  {isSelected && status === 'PENDING' && (
                    <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-semibold">Pending approval</span>
                  )}
                  {isSelected && status === 'APPROVED' && (
                    <span className="rounded-full bg-green-100 text-green-800 px-3 py-1 text-xs font-semibold">Member</span>
                  )}
                  {isSelected && status === 'REJECTED' && (
                    <span className="rounded-full bg-red-100 text-red-800 px-3 py-1 text-xs font-semibold">Request rejected</span>
                  )}
                </div>

                {!homecell?.id && (
                  <p className="text-sm text-gray-600">
                    You'll need a homecell set first — visit{' '}
                    <Link to="/departments" className="text-primary-600 font-semibold hover:underline">Departments</Link>{' '}
                    to choose one.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Worship Gallery Section */}
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-8 md:p-12 border-l-4 border-primary-600 animate-fadeInUp">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-5xl mb-4">🎼</div>
              <h2 className="text-3xl font-bold text-primary-800 mb-4">Experience Worship</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Join us for powerful worship experiences that blend contemporary and traditional styles,
                creating an atmosphere where God's presence is tangible.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-primary-600 shadow-sm">🎹 Contemporary</span>
                <span className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-primary-600 shadow-sm">🎤 Choir</span>
                <span className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-primary-600 shadow-sm">🥁 Celebration</span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl p-8 text-white text-center">
                <div className="text-6xl mb-4">🙌</div>
                <p className="text-lg font-semibold">Lift Your Voice</p>
                <p className="text-primary-200 text-sm mt-2">Come worship with us!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
