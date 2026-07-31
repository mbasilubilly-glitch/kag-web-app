import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'


export default function SingleSermon() {
  const { id } = useParams()
  const [sermon, setSermon] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/sermons/${id}/`)
      .then((response) => setSermon(response.data))
      .catch(() => setError('Unable to load sermon details.'))
  }, [id])

  return (
    <div className="container py-10">
      {error ? (
        <div className="rounded-3xl bg-red-100 p-8 text-red-800">{error}</div>
      ) : sermon ? (
        <div className="rounded-3xl bg-white p-8 shadow-sm space-y-6">
          <h1 className="text-3xl font-bold">{sermon.title}</h1>
          <p className="text-slate-600">Speaker: {sermon.speaker}</p>
          <p className="text-slate-600">Category: {sermon.category}</p>
          <p className="text-slate-600">Published: {new Date(sermon.created_at).toLocaleDateString()}</p>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {sermon.video_url && (
                <a href={sermon.video_url} target="_blank" rel="noreferrer" className="block rounded-2xl bg-slate-900 px-5 py-3 text-white w-fit">Watch Video Sermon</a>
              )}
              {sermon.audio_url && (
                <a href={sermon.audio_url} target="_blank" rel="noreferrer" className="block rounded-2xl bg-slate-900 px-5 py-3 text-white w-fit">Listen to Audio Sermon</a>
              )}
              {sermon.notes_url && (
                <a href={sermon.notes_url} target="_blank" rel="noreferrer" className="block rounded-2xl bg-slate-900 px-5 py-3 text-white w-fit">Download Sermon Notes</a>
              )}
            </div>

            {(sermon.video_url || sermon.audio_url || sermon.notes_url) && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const { cacheMediaUrls } = await import('../utils/offlineMedia')
                    const urls = [sermon.video_url, sermon.audio_url, sermon.notes_url].filter(Boolean)
                    await cacheMediaUrls(urls)
                    alert('Saved for offline. You can access this sermon content without internet (if it was cached successfully).')
                  } catch (e) {
                    alert('Could not cache sermon for offline use.')
                  }
                }}
                className="block w-full rounded-2xl bg-emerald-700 px-5 py-3 text-white font-semibold"
              >
                Save for Offline
              </button>
            )}
          </div>

          {sermon.summary && <p className="text-slate-700">{sermon.summary}</p>}
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-100 p-10 text-slate-600">Loading sermon details...</div>
      )}
    </div>
  )
}
