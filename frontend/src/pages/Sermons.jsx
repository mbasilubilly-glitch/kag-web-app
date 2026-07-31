import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function Sermons() {
  const [sermons, setSermons] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/sermons/')
      .then((response) => {
        setSermons(response.data || [])
        setError('')
      })
      .catch((err) => {
        console.error('Failed to load sermons:', err)
        setError('Unable to load sermons. Please try again later.')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen pb-10">
      {/* Header Section */}
      <section className="bg-gradient-hero text-white px-4 py-12 md:py-16">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">🎥 Sermons</h1>
          <p className="text-lg text-primary-100">Browse inspiring messages, watch videos, listen to audio, and download study notes from our pastors and ministry leaders.</p>
        </div>
      </section>

      {/* Content Section */}
      <div className="container px-4 py-12">
        {error && (
          <div className="mb-8 rounded-2xl bg-danger-50 border-l-4 border-danger-500 p-6 text-danger-800">
            <p className="font-semibold">⚠️ Unable to Load</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading sermons...</p>
          </div>
        ) : sermons.length === 0 && !error ? (
          <div className="rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="text-5xl mb-4">🎥</div>
            <p className="text-gray-700 font-semibold text-lg">No sermons available yet</p>
            <p className="text-gray-600 mt-2">Check back soon for new messages</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {sermons.map((sermon) => (
              <article key={sermon.id} className="group rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-2xl transition border-t-4 border-primary-600 h-full flex flex-col">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-primary-50 to-accent-50 p-6 border-b border-primary-100">
                  <div className="flex items-start justify-between">
                    <h2 className="text-xl font-bold text-primary-800 group-hover:text-primary-600 transition line-clamp-2">
                      {sermon.title}
                    </h2>
                    <span className="text-2xl">🎙️</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex-1 p-6 space-y-3">
                  {sermon.speaker && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">👤</span>
                      <span className="text-gray-700"><strong>Speaker:</strong> {sermon.speaker}</span>
                    </div>
                  )}
                  {sermon.category && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">📂</span>
                      <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                        {sermon.category}
                      </span>
                    </div>
                  )}
                  {sermon.description && (
                    <p className="text-gray-600 text-sm line-clamp-3">{sermon.description}</p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="px-6 py-4 border-t border-gray-100 space-y-2">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {sermon.video_url && (
                      <a href={sermon.video_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition">
                        ▶️ Video
                      </a>
                    )}
                    {sermon.audio_url && (
                      <a href={sermon.audio_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary-500 text-white text-xs font-semibold rounded-lg hover:bg-secondary-600 transition">
                        🎵 Audio
                      </a>
                    )}
                    {sermon.notes_url && (
                      <a href={sermon.notes_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent-500 text-white text-xs font-semibold rounded-lg hover:bg-accent-600 transition">
                        📄 Notes
                      </a>
                    )}
                  </div>
                  <Link to={`/sermons/${sermon.id}`} className="block w-full px-4 py-2.5 bg-primary-100 text-primary-700 font-semibold text-center rounded-lg hover:bg-primary-200 transition">
                    View Full Details →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
