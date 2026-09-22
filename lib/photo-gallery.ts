import { cacheLife } from 'next/cache'
import { getPhotoPosts } from './api'
import { comparePhotoStackOrder } from './photo-stacks'

export async function getPhotoGroups() {
  'use cache'
  cacheLife('max')
  const photos = await getPhotoPosts(['title', 'date', 'slug', 'basename', 'width', 'height', 'photoStack', 'photoStackTitle', 'photoStackOrder'])
  const groups = new Map<string, typeof photos>()
  for (const photo of photos) {
    const key = photo.photoStack ? `stack:${photo.photoStack}` : `photo:${photo.slug}`
    const group = groups.get(key)
    if (group) group.push(photo)
    else groups.set(key, [photo])
  }
  return Array.from(groups, ([key, photos]) => ({ key, photos: photos.sort(comparePhotoStackOrder) }))
}
