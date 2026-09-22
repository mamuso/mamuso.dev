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
  let cached: RecentTrack | null = null
  let expires = 0
  let staleUntil = 0
  let pending: Promise<RecentTrack | null> | null = null

  async function load(): Promise<RecentTrack | null | undefined> {
    try {
      const { developerToken, userToken } = credentials()
      if (!developerToken || !userToken) return null
      const response = await request('https://api.music.apple.com/v1/me/recent/played/tracks?limit=1', {
        headers: { Authorization: `Bearer ${developerToken}`, 'Music-User-Token': userToken },
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(5000),
      })
      if (response.status === 429 || response.status >= 500) return undefined
      if (!response.ok) return null
      return publicTrack(await response.json())
    } catch {
      // Do not log upstream bodies, errors or request headers: they may contain credentials.
      return undefined
    }
  }

  return function read(): Promise<RecentTrack | null> {
    if (now() < expires) return Promise.resolve(cached)
    if (pending) return pending
    pending = load().then(track => {
      if (track !== undefined) {
        cached = track
        staleUntil = track ? now() + 15 * 60_000 : 0
      } else if (now() >= staleUntil) {
        cached = null
      }
      expires = now() + (track === undefined ? 15_000 : 60_000)
      return cached
    }).finally(() => { pending = null })
    return pending
  }
}
