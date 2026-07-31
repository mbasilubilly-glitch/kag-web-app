// Turns a livestream link (YouTube/Facebook share URL, or anything else)
// into embed info. We only know how to build a real <iframe> embed for
// YouTube and Facebook - other platforms (Instagram, TikTok, Twitch, a
// bare RTMP page, ...) generally block being framed, so for those we're
// honest about it and just link out instead of faking a broken embed.

const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com']
const FACEBOOK_HOSTS = ['facebook.com', 'www.facebook.com', 'fb.watch', 'm.facebook.com']

function hostnameOf(url) {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return ''
  }
}

function youtubeVideoId(url) {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1)
    if (u.pathname.startsWith('/embed/')) return u.pathname.split('/embed/')[1]
    if (u.pathname.startsWith('/live/')) return u.pathname.split('/live/')[1]
    return u.searchParams.get('v')
  } catch {
    return null
  }
}

// A channel's permanent "/live" URL (e.g. youtube.com/channel/UCxxxx/live)
// has no video id of its own - it just redirects to whatever's currently
// broadcasting, or nothing. YouTube's embed API can show that same
// "whatever's live right now" behavior inline, but only when given the
// raw channel id (the UCxxxx… form), not a @handle - handles aren't
// resolvable to a channel id client-side without hitting YouTube's API.
function youtubeChannelId(url) {
  try {
    const u = new URL(url)
    const match = u.pathname.match(/^\/channel\/(UC[\w-]+)\/live\/?$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

export function getStreamEmbedInfo(url) {
  if (!url) return null
  const host = hostnameOf(url)

  if (YOUTUBE_HOSTS.some((h) => host === h)) {
    const id = youtubeVideoId(url)
    if (id) {
      return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${id}?autoplay=0`, platformLabel: 'YouTube' }
    }
    const channelId = youtubeChannelId(url)
    if (channelId) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=0`,
        platformLabel: 'YouTube',
      }
    }
  }

  if (FACEBOOK_HOSTS.some((h) => host === h)) {
    return {
      type: 'facebook',
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`,
      platformLabel: 'Facebook',
    }
  }

  return { type: 'linkout', embedUrl: null, platformLabel: host || 'the stream' }
}
