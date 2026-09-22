import { getPhotoGroups } from '@/lib/photo-gallery'
import { PHOTO_GALLERY_BATCH_SIZE, photoGalleryWindow } from '@/lib/photo-gallery-window'

/** Public photo metadata only. HTML deep links still render cumulative windows. */
export async function GET(request: Request) {
  const values = new URL(request.url).searchParams.getAll('page')
  const groups = await getPhotoGroups()
  const window = photoGalleryWindow(values.length === 1 ? values[0] : values, groups.length)
  if (!window) return Response.json({ error: 'Invalid photo page' }, { status: 400 })
  return Response.json({
    page: window.page,
    totalCount: groups.length,
    groups: groups.slice((window.page - 1) * PHOTO_GALLERY_BATCH_SIZE, window.visibleCount),
  }, { headers: { 'Cache-Control': 'no-store' } })
}
