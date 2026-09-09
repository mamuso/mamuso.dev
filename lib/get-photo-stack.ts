import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getPhotoPosts } from './api'
import { comparePhotoStackOrder } from './photo-stacks'

/** Shared by the standalone collection, its metadata and the intercepted viewer. */
export const getPhotoStack = cache((stack: string) => {
  const photos = getPhotoPosts(['title', 'slug', 'date', 'basename', 'width', 'height', 'photoStack', 'photoStackTitle', 'photoStackOrder', 'camera', 'iso', 'fnumber', 'exposureBiasValue', 'exposureTime', 'GPSLatitude', 'GPSLongitude', 'colorPalette'])
    .filter((photo) => photo.photoStack === stack)
    .sort(comparePhotoStackOrder)
  if (!photos.length) notFound()
  return photos
})
