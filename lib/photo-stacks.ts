import type { PostType } from './types'

export function comparePhotoStackOrder(a: PostType, b: PostType) {
  const orderA = Number.isFinite(a.photoStackOrder) ? a.photoStackOrder! : Infinity
  const orderB = Number.isFinite(b.photoStackOrder) ? b.photoStackOrder! : Infinity
  return orderA === orderB ? 0 : orderA < orderB ? -1 : 1
}
