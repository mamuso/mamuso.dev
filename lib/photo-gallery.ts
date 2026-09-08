import { cache } from 'react'
import { getPhotoPosts } from './api'
import { comparePhotoStackOrder } from './photo-stacks'
import type { PostType } from './types'

export const getPhotoGroups = cache(() => {
  const photos = getPhotoPosts(['title', 'date', 'slug', 'basename', 'width', 'height', 'photoStack', 'photoStackTitle', 'photoStackOrder'])
  const groups = new Map<string, PostType[]>()
  for (const photo of photos) {
    const key = photo.photoStack ? `stack:${photo.photoStack}` : `photo:${photo.slug}`
    const group = groups.get(key)
    if (group) group.push(photo)
    else groups.set(key, [photo])
  }
  return Array.from(groups, ([key, photos]) => ({ key, photos: photos.sort(comparePhotoStackOrder) }))
})
