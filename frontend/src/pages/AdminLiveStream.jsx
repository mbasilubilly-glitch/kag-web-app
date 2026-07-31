import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { extractErrorMessage } from '../utils/errors'
import { getStreamEmbedInfo } from '../utils/liveStream'

export default function AdminLiveStream() {
  const [url, setUrl] = useState('')
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [pastBroadcasts, setPastBroadcasts] = useState([])
  const [pastLoading, setPastLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)

  const [archiveTitle, setArchiveTitle] = useState('')
  const [archiveUrl, setArchiveUrl] = useState('')
  const [addingArchive, setAddingArchive] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/live-stream/')
      .then((res) => {
        setUrl(res.data.url || '')
        setMeta(res.data)
      })
      .catch(() => setError('Unable to load livestream settings.'))
      .finally(() => setLoading(false))
  }

  const loadPastBroadcasts = () => {
    setPastLoading(true)
    api.get('/sermons/')
      .then((res) => {
        const all = res.data?.results || res.data || []
        setPastBroadcasts(
          all
            .filter((s) => s.category === 'Live Recording')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        )
      })
      .catch(() => setPastBroadcasts([]))
      .finally(() => setPastLoading(false))
  }

  useEffect(load, [])
  useEffect(loadPastBroadcasts, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setSaving(true)
    try {
      const res = await api.patch('/live-stream/', { url })
      setMeta(res.data)
      setNotice('Livestream link saved. It will show live on the public Live page automatically.')
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to save livestream settings.'))
    } finally {
      setSaving(false)
    }
  }

  const addToArchive = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    if (!archiveTitle.trim() || !archiveUrl.trim()) {
      setError('Enter both a title and the recorded video link.')
      return
    }
    setAddingArchive(true)
    try {
      await api.post('/sermons/', {
        title: archiveTitle,
        speaker: '',
        category: 'Live Recording',
        video_url: archiveUrl,
      })
      setArchiveTitle('')
      setArchiveUrl('')
      setNotice('Added to the past streams archive.')
      loadPastBroadcasts()
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to add this recording.'))
    } finally {
      setAddingArchive(false)
    }
  }

  const removeBroadcast = async (id) => {
    if (!confirm('Remove this recording from the archive and Sermon Library?')) return
    setRemovingId(id)
    try {
      await api.delete(`/sermons/${id}/`)
      setPastBroadcasts((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to remove this recording.'))
    } finally {
      setRemovingId(null)
    }
  }

  const preview = url ? getStreamEmbedInfo(url) : null

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Live Stream</h1>
        <p className="text-slate-600 mt-2">
          Paste your channel's permanent live link once (e.g. a YouTube channel's <code>/live</code> URL or a
          Facebook Page's <code>/live</code> URL) - the public Live page embeds it directly and displays your
          broadcast automatically whenever you go live from that channel. No need to update anything per service.
        </p>
      </div>

      {error && <div className="rounded-3xl bg-red-100 p-6 text-red-800">{error}</div>}
      {notice && <div className="rounded-3xl bg-green-100 p-6 text-green-800">{notice}</div>}

      {loading ? (
        <div className="text-slate-500">Loading…</div>
      ) : (
        <form onSubmit={handleSave} className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 space-y-4">
          <label>
            <span className="text-slate-700 text-sm">Channel's Permanent Live Link</span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/channel/UCxxxxxxxx/live or https://www.facebook.com/YourPage/live"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>

          {meta?.updated_by_name && (
            <p className="text-xs text-slate-500">Last updated by {meta.updated_by_name}</p>
          )}

          <button disabled={saving} type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold mb-4">Preview</h2>
        {preview?.type === 'youtube' || preview?.type === 'facebook' ? (
          <div className="aspect-video w-full max-w-2xl rounded-2xl overflow-hidden bg-slate-900">
            <iframe src={preview.embedUrl} title="Preview" className="w-full h-full" allowFullScreen />
          </div>
        ) : preview?.type === 'linkout' ? (
          <p className="text-slate-600 text-sm">
            This platform can't be embedded directly - visitors will see a "Watch on {preview.platformLabel}"
            button linking to the URL above.
          </p>
        ) : (
          <p className="text-slate-500 text-sm">Enter your channel's permanent live link above to preview the embed.</p>
        )}
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Add a Past Stream</h2>
          <p className="text-slate-600 text-sm mt-1">
            Whenever a stream ends, paste that service's recorded video link here to add it to the archive
            visitors see on the public Live page.
          </p>
        </div>
        <form onSubmit={addToArchive} className="space-y-4">
          <label className="block">
            <span className="text-slate-700 text-sm">Title</span>
            <input
              value={archiveTitle}
              onChange={(e) => setArchiveTitle(e.target.value)}
              placeholder="e.g. Sunday 1st Service - July 27, 2026"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="text-slate-700 text-sm">Recorded Video Link</span>
            <input
              type="url"
              value={archiveUrl}
              onChange={(e) => setArchiveUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... or https://www.facebook.com/.../videos/..."
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>
          <button disabled={addingArchive} type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60">
            {addingArchive ? 'Adding…' : 'Add to Archive'}
          </button>
        </form>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold mb-1">Past Streams Archive</h2>
        <p className="text-slate-600 text-sm mb-4">
          The recordings visitors see on the public Live page. Edit details in the Sermon Library, or remove one entirely.
        </p>
        {pastLoading ? (
          <div className="text-slate-500">Loading…</div>
        ) : pastBroadcasts.length === 0 ? (
          <div className="text-slate-500 text-sm">No past broadcasts yet - add one above once a stream ends.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pastBroadcasts.map((s) => (
              <div key={s.id} className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-800 truncate" title={s.title}>{s.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{new Date(s.created_at).toLocaleString()}</p>
                <a href={s.video_url} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline break-all mt-1 block">
                  {s.video_url}
                </a>
                <div className="flex gap-2 mt-3">
                  <Link to={`/admin/sermons/${s.id}/edit`} className="flex-1 text-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
                    Edit
                  </Link>
                  <button
                    disabled={removingId === s.id}
                    onClick={() => removeBroadcast(s.id)}
                    className="flex-1 rounded-full bg-red-500/15 text-red-700 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/25 disabled:opacity-60"
                  >
                    {removingId === s.id ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
