import { getRecentTrack } from '../../../lib/apple-music.server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const track = await getRecentTrack()
  return Response.json({ track }, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=60',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
