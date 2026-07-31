import { useEffect, useRef } from 'react'

const JITSI_DOMAIN = 'meet.jit.si'
const SCRIPT_SRC = `https://${JITSI_DOMAIN}/external_api.js`

let scriptLoadPromise = null
function loadJitsiScript() {
  if (window.JitsiMeetExternalAPI) return Promise.resolve()
  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      script.onload = resolve
      script.onerror = () => {
        scriptLoadPromise = null
        reject(new Error('Failed to load the video meeting engine.'))
      }
      document.body.appendChild(script)
    })
  }
  return scriptLoadPromise
}

// Extracts a Jitsi room name from a meeting_link like
// https://meet.jit.si/KAGUnity-friday-fellowship - falls back to a fixed
// name so a malformed/blank link never crashes the embed.
export function getJitsiRoomName(meetingLink) {
  try {
    const path = new URL(meetingLink).pathname.replace(/^\//, '')
    return path || 'KAGUnityChurchSession'
  } catch {
    return 'KAGUnityChurchSession'
  }
}

/**
 * Embeds a Jitsi Meet room with its native toolbar (mic mute, camera
 * on/off, screen share, chat, etc.) - no custom controls needed, Jitsi's
 * own UI already covers what members need. Used only for platform
 * 'built_in' sessions; Google Meet/Zoom/Teams open in their own tab
 * instead since we don't control those UIs.
 */
export default function JitsiMeetingRoom({ roomName, displayName, onLeave }) {
  const containerRef = useRef(null)
  const apiRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    loadJitsiScript()
      .then(() => {
        if (cancelled || !containerRef.current) return
        apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName,
          parentNode: containerRef.current,
          width: '100%',
          height: 600,
          userInfo: displayName ? { displayName } : undefined,
          configOverwrite: { prejoinPageEnabled: false },
        })
        apiRef.current.addListener('readyToClose', () => {
          onLeave?.()
        })
      })
      .catch(() => {
        if (!cancelled) onLeave?.('error')
      })

    return () => {
      cancelled = true
      apiRef.current?.dispose()
      apiRef.current = null
    }
  }, [roomName, displayName, onLeave])

  return <div ref={containerRef} className="rounded-2xl overflow-hidden border border-slate-200" />
}
