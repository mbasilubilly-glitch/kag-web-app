import { useEffect, useRef, useState } from 'react'
import { getStreamEmbedInfo, loadYouTubeIframeApi } from '../utils/liveStream'

// Renders a livestream/recording link as a playable embed when possible.
// For YouTube specifically, also watches for the video owner having
// disabled embedding on other sites - YouTube reports this as onError
// codes 101/150 via its IFrame Player API rather than a normal load
// failure, so a plain <iframe> alone can't detect it; it just silently
// shows YouTube's own broken-embed message inside the frame. When that
// happens we swap to a clean "Watch on YouTube" fallback instead.
export default function StreamEmbed({ url, emptyTitle = 'No video available', emptyHint = '' }) {
  const idRef = useRef(`stream-embed-${Math.random().toString(36).slice(2)}`)
  const [embedFailed, setEmbedFailed] = useState(false)
  const embed = url ? getStreamEmbedInfo(url) : null

  useEffect(() => {
    setEmbedFailed(false)
    if (embed?.type !== 'youtube') return undefined

    let cancelled = false
    let player = null

    loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled || !document.getElementById(idRef.current)) return
        player = new YT.Player(idRef.current, {
          events: {
            onError: () => {
              // Any error code here means this specific video can't play in
              // our embed (101/150 = embedding disabled, 100 = removed/
              // private) - fall back rather than leave YouTube's own error
              // message stuck inside the frame.
              if (!cancelled) setEmbedFailed(true)
            },
          },
        })
      })
      .catch(() => {
        // API failed to load at all (offline, blocked, ...) - leave the
        // plain iframe in place; it'll show its own state.
      })

    return () => {
      cancelled = true
      try {
        player?.destroy?.()
      } catch (_) {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embed?.embedUrl])

  if (embed?.type === 'youtube' && !embedFailed) {
    return (
      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900">
        <iframe
          id={idRef.current}
          src={embed.embedUrl}
          title="Video"
          className="w-full h-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  if (embed?.type === 'facebook') {
    return (
      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900">
        <iframe src={embed.embedUrl} title="Video" className="w-full h-full" allowFullScreen />
      </div>
    )
  }

  if (embed?.type === 'linkout' || (embed?.type === 'youtube' && embedFailed)) {
    return (
      <div className="aspect-video w-full rounded-2xl bg-slate-900 flex flex-col items-center justify-center text-center px-6">
        <div className="text-5xl mb-4">🎥</div>
        <p className="text-white font-semibold">
          {embedFailed ? "This video can't be played here" : `Watch on ${embed.platformLabel}`}
        </p>
        {embedFailed && (
          <p className="text-slate-400 text-sm mt-2 max-w-sm">
            The video owner has disabled playback on other websites for this one.
          </p>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block px-6 py-3 bg-secondary-400 text-primary-900 font-bold rounded-xl hover:bg-secondary-300 transition"
        >
          Watch on {embed.platformLabel} →
        </a>
      </div>
    )
  }

  return (
    <div className="aspect-video w-full rounded-2xl bg-slate-900 flex flex-col items-center justify-center text-center px-6">
      <div className="text-5xl mb-4">🎥</div>
      <p className="text-white font-semibold">{emptyTitle}</p>
      {emptyHint && <p className="text-slate-400 text-sm mt-2 max-w-sm">{emptyHint}</p>}
    </div>
  )
}
