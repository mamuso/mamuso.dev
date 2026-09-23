export type RecentTrack = {
  name: string
  artist: string
  artwork: string | null
  bgColor: string | null
  url: string | null
}

function safeURL(value: unknown, artwork = false): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    const allowed = artwork
      ? url.hostname.endsWith('.mzstatic.com')
      : url.hostname === 'music.apple.com'
    if (!allowed || url.protocol !== 'https:' || url.username || url.password || url.port) return null
    url.search = ''
    // Apple song links identify the track with ?i=; preserve only that public ID.
    if (!artwork) {
      const id = new URL(value).searchParams.get('i')
      if (id && /^\d+$/.test(id)) url.searchParams.set('i', id)
    }
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

/** Explicit public projection: never return Apple's response or account fields. */
export function publicTrack(payload: unknown): RecentTrack | null {
  if (!payload || typeof payload !== 'object' || !('data' in payload) || !Array.isArray(payload.data)) return null
  const track = payload.data[0]
  if (!track || !['songs', 'library-songs'].includes(track.type)) return null
  const attributes = track.attributes
  if (!attributes || typeof attributes.name !== 'string' || typeof attributes.artistName !== 'string') return null
  const name = attributes.name.trim().slice(0, 300)
  const artist = attributes.artistName.trim().slice(0, 300)
  if (!name || !artist) return null
  const artwork = typeof attributes.artwork?.url === 'string'
    ? attributes.artwork.url.replaceAll('{w}', '160').replaceAll('{h}', '160')
    : null
  const color = attributes.artwork?.bgColor
  const bgColor = typeof color === 'string' && /^[0-9a-f]{6}$/i.test(color) ? '#' + color : null
  return { name, artist, bgColor, artwork: safeURL(artwork, true), url: safeURL(attributes.url) }
}

export type RecentMusicResult =
  | { status: 'ready'; track: RecentTrack }
  | { status: 'empty' | 'unavailable'; track: null }

/** Used only by the server-only boundary. Dependencies are injectable for security tests. */
export function createRecentTrackReader({
  credentials,
  request = fetch,
  now = Date.now,
}: {
  credentials: () => { developerToken?: string, userToken?: string }
  request?: typeof fetch
  now?: () => number
}) {
  let cached: RecentMusicResult = { status: 'unavailable', track: null }
  let expires = 0
  let pending: Promise<RecentMusicResult & { refreshAfterMs: number }> | null = null

  async function load(): Promise<RecentMusicResult> {
    try {
      const { developerToken, userToken } = credentials()
      if (!developerToken || !userToken) return { status: 'unavailable', track: null }
      const response = await request('https://api.music.apple.com/v1/me/recent/played/tracks?limit=1&types=songs,library-songs', {
        headers: { Authorization: `Bearer ${developerToken}`, 'Music-User-Token': userToken },
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(5000),
      })
      if (!response.ok) return { status: 'unavailable', track: null }
      const payload: unknown = await response.json()
      if (payload && typeof payload === 'object' && 'data' in payload &&
        Array.isArray(payload.data) && payload.data.length === 0) return { status: 'empty', track: null }
      const track = publicTrack(payload)
      return track ? { status: 'ready', track } : { status: 'unavailable', track: null }
    } catch {
      // Do not log upstream bodies, errors or request headers: they may contain credentials.
      return { status: 'unavailable', track: null }
    }
  }

  function snapshot() {
    return { ...cached, refreshAfterMs: Math.max(0, expires - now()) }
  }

  return function read(): Promise<RecentMusicResult & { refreshAfterMs: number }> {
    if (now() < expires) return Promise.resolve(snapshot())
    if (pending) return pending
    pending = load().then(result => {
      // A failed refresh always clears the previous song, with a short retry cooldown.
      cached = result
      expires = now() + (result.status === 'unavailable' ? 15_000 : 60_000)
      return snapshot()
    }).finally(() => { pending = null })
    return pending
  }
}
