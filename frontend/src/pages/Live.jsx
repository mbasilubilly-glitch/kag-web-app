import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import StreamEmbed from '../components/StreamEmbed'

const SERVICE_TIMES = [
  { label: 'Sunday 1st Service', time: '8:00 AM' },
  { label: 'Sunday 2nd Service', time: '10:30 AM' },
  { label: 'Bible Study', time: 'Monday, 6:00 PM' },
  { label: 'Prayer Meeting', time: 'Friday, 7:00 PM' },
  { label: 'Youth Service', time: 'Saturday, 5:00 PM' },
]

export default function Live() {
  const [stream, setStream] = useState(null)
  const [pastBroadcasts, setPastBroadcasts] = useState([])

  useEffect(() => {
    api.get('/live-stream/').then((res) => setStream(res.data)).catch(() => setStream(null))
    api.get('/sermons/')
      .then((res) => setPastBroadcasts((res.data || []).filter((s) => s.category === 'Live Recording' && s.video_url)))
      .catch(() => setPastBroadcasts([]))
  }, [])

  return (
    <div className="min-h-screen pb-10">
      {/* Hero */}
      <section className="bg-gradient-hero text-white px-4 py-16 md:py-20">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-6">
            <span className="text-secondary-200 text-sm font-semibold">📡 Join Us Live</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Worship <span className="bg-gradient-to-r from-secondary-300 to-secondary-100 bg-clip-text text-transparent">With Us Online</span>
          </h1>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto">
            Can't make it in person? Tune in live, or watch any past broadcast below anytime you want.
          </p>
        </div>
      </section>

      <div className="container px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Livestream player area */}
          <div className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-lg border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-display text-2xl font-bold text-primary-800">Livestream</h2>
              {stream?.is_live && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 text-white text-xs font-bold px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE NOW
                </span>
              )}
            </div>
            <StreamEmbed
              url={stream?.url || null}
              emptyTitle="No service is streaming right now"
              emptyHint="The stream opens shortly before each service listed on the right. Check back at the scheduled time."
            />
            <p className="text-slate-500 text-sm mt-4">
              Missed a service? Full recordings are available in our <Link to="/sermons" className="text-primary-600 font-semibold hover:underline">Sermon Library</Link>.
            </p>
          </div>

          {/* Service times */}
          <div className="rounded-3xl bg-white p-6 shadow-lg border border-slate-100 h-fit">
            <h2 className="font-display text-xl font-bold text-primary-800 mb-4">Service Times</h2>
            <ul className="space-y-3">
              {SERVICE_TIMES.map((s) => (
                <li key={s.label} className="flex justify-between items-center pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <span className="font-semibold text-gray-700">{s.label}</span>
                  <span className="text-primary-600 text-sm">{s.time}</span>
                </li>
              ))}
            </ul>
            <a
              href="/campus"
              className="mt-6 block w-full text-center px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition shadow-md"
            >
              Find a Campus
            </a>
          </div>
        </div>

        {/* Past broadcasts - anyone can watch anytime, no login required */}
        {pastBroadcasts.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-2xl font-bold text-primary-800 mb-2">Watch Past Broadcasts Anytime</h2>
            <p className="text-slate-600 mb-6">Recordings from past services, added by our team after each stream.</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pastBroadcasts.map((s) => (
                <div key={s.id} className="rounded-2xl bg-white p-4 shadow-lg border border-slate-100">
                  <StreamEmbed url={s.video_url} />
                  <h3 className="font-display font-bold text-primary-800 mt-3">{s.title}</h3>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
