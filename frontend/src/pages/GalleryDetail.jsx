import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'

function Lightbox({ items, index, onClose, onNavigate }) {
  const item = items[index]

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNavigate((index + 1) % items.length)
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + items.length) % items.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, items.length, onClose, onNavigate])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      // clipboard API unavailable - silently ignore, link is already in the address bar
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 text-white text-3xl w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition"
      >
        ✕
      </button>

      {items.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate((index - 1 + items.length) % items.length) }}
            aria-label="Previous"
            className="absolute left-2 md:left-6 text-white text-4xl w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition"
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate((index + 1) % items.length) }}
            aria-label="Next"
            className="absolute right-2 md:right-6 text-white text-4xl w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition"
          >
            ›
          </button>
        </>
      )}

      <div className="max-w-5xl max-h-[85vh] px-4 flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
        {item.item_type === 'photo' ? (
          <img src={item.image} alt={item.caption || 'Gallery photo'} className="max-h-[75vh] max-w-full object-contain rounded-lg" />
        ) : (
          <a href={item.video_url} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-3 text-white p-16 bg-primary-900 rounded-lg">
            <span className="text-6xl">▶</span>
            <span>Watch on original site</span>
          </a>
        )}

        <div className="flex items-center gap-4 text-white/90 text-sm">
          {item.caption && <span>{item.caption}</span>}
          <span className="text-white/50">{index + 1} / {items.length}</span>
          {item.item_type === 'photo' && (
            <a href={item.image} download className="px-4 py-1.5 rounded-full border border-white/30 hover:bg-white/10 transition">Download</a>
          )}
          <button onClick={copyLink} className="px-4 py-1.5 rounded-full border border-white/30 hover:bg-white/10 transition">Copy Link</button>
        </div>
      </div>
    </div>
  )
}

function ItemGrid({ items, onOpen, indexOffset }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <div key={item.id} className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition">
          {item.item_type === 'photo' ? (
            <button type="button" onClick={() => onOpen(indexOffset + i)} title="View full size" className="block w-full">
              <img src={item.image} alt={item.caption || 'Gallery photo'} className="w-full aspect-square object-cover hover:scale-[1.02] transition" />
            </button>
          ) : (
            <a href={item.video_url} target="_blank" rel="noreferrer" className="relative flex flex-col items-center justify-center w-full aspect-square bg-primary-900 text-white gap-2 hover:bg-primary-800 transition overflow-hidden">
              {item.thumbnail && <img src={item.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />}
              <span className="relative text-4xl">▶</span>
              <span className="relative text-xs px-3 text-center text-primary-100">Watch Video</span>
            </a>
          )}
          {item.caption && <p className="text-xs text-gray-600 bg-white px-2 py-1.5 truncate" title={item.caption}>{item.caption}</p>}
        </div>
      ))}
    </div>
  )
}

export default function GalleryDetail() {
  const { id } = useParams()
  const [gallery, setGallery] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    api.get(`/galleries/${id}/`)
      .then((res) => setGallery(res.data))
      .catch((err) => {
        const detail = err?.response?.data?.detail
        setError(detail || 'Unable to load this gallery. It may be private or no longer available.')
      })
      .finally(() => setLoading(false))
  }, [id])

  // Flattened across "no album" items + every album's items, in display
  // order, so the lightbox can navigate prev/next across the whole gallery.
  const allItems = useMemo(() => {
    if (!gallery) return []
    const albumItems = (gallery.albums || []).flatMap((a) => a.items || [])
    return [...(gallery.items || []), ...albumItems]
  }, [gallery])

  const topLevelCount = gallery?.items?.length || 0

  const shareGallery = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setNotice('Gallery link copied to clipboard.')
    } catch {
      setNotice(window.location.href)
    }
    setTimeout(() => setNotice(''), 4000)
  }

  const isEmpty = gallery && !gallery.items?.length && !(gallery.albums || []).some((a) => a.items?.length)

  return (
    <div className="min-h-screen pb-10">
      <section className="bg-gradient-hero text-white px-4 py-12 md:py-16">
        <div className="container max-w-4xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Link to="/galleries" className="text-primary-100 text-sm hover:text-white">← All Galleries</Link>
            {gallery && (
              <button onClick={shareGallery} className="text-sm px-4 py-1.5 rounded-full border border-white/30 hover:bg-white/10 transition">
                Share Gallery
              </button>
            )}
          </div>
          {gallery && (
            <>
              <h1 className="text-3xl md:text-5xl font-bold mt-2 mb-3">{gallery.title}</h1>
              {gallery.description && <p className="text-lg text-primary-100">{gallery.description}</p>}
              {gallery.event_name && (
                <p className="text-primary-200 text-sm mt-2">
                  {gallery.event_name}{gallery.event_theme ? ` — "${gallery.event_theme}"` : ''}{gallery.event_location ? ` · ${gallery.event_location}` : ''}
                </p>
              )}
            </>
          )}
          {notice && <p className="mt-2 text-sm text-secondary-300">{notice}</p>}
        </div>
      </section>

      <div className="container px-4 py-12 space-y-10">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading gallery...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-danger-50 border-l-4 border-danger-500 p-6 text-danger-800">
            <p className="font-semibold">⚠️ {error}</p>
          </div>
        ) : isEmpty ? (
          <div className="rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="text-5xl mb-4">🖼️</div>
            <p className="text-gray-700 font-semibold text-lg">No photos or videos in this gallery yet</p>
          </div>
        ) : (
          <>
            {gallery.items?.length > 0 && (
              <ItemGrid items={gallery.items} onOpen={setLightboxIndex} indexOffset={0} />
            )}

            {(gallery.albums || []).map((album) => {
              if (!album.items?.length) return null
              const offset = topLevelCount + (gallery.albums || [])
                .slice(0, gallery.albums.indexOf(album))
                .reduce((sum, a) => sum + (a.items?.length || 0), 0)
              return (
                <div key={album.id}>
                  <h2 className="font-display text-2xl font-bold text-primary-800 mb-4">{album.name}</h2>
                  <ItemGrid items={album.items} onOpen={setLightboxIndex} indexOffset={offset} />
                </div>
              )
            })}
          </>
        )}
      </div>

      {lightboxIndex !== null && allItems.length > 0 && (
        <Lightbox
          items={allItems}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  )
}
