/** Each URL represents a cumulative window so refresh and Back can restore the gallery. */
export const PHOTO_GALLERY_BATCH_SIZE = 24

export function photoGalleryWindow(rawPage: string | string[] | undefined, count: number) {
  const totalPages = Math.max(1, Math.ceil(count / PHOTO_GALLERY_BATCH_SIZE))
  if (rawPage !== undefined && (typeof rawPage !== 'string' || !/^[1-9]\d*$/.test(rawPage) || Number(rawPage) > totalPages)) return null
  const page = Number(rawPage ?? 1)
  return { page, totalPages, visibleCount: Math.min(count, page * PHOTO_GALLERY_BATCH_SIZE) }
}
