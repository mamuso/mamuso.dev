import { connection } from 'next/server'
import { getRecentTrack } from '../../../lib/apple-music.server'

export async function GET() {
  await connection()
  const result = await getRecentTrack()
  return Response.json(result, {
    status: result.status === 'unavailable' ? 503 : 200,
    headers: {
      'Cache-Control': 'no-store',
      ...(result.status === 'unavailable' ? { 'Retry-After': '15' } : {}),
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
