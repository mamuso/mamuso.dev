import { cache } from 'react'
import type { PostType, PhotoPost, NotePost, SelectedPost } from './types'
import { readPostIndex } from './post-index'

const getPostIndex = cache(() => readPostIndex())
const getSortedPosts = cache(() => getPostIndex().posts.map(post => post.data)
  .sort((a, b) => a.date > b.date ? -1 : a.date < b.date ? 1 : 0))

export function resolvePostSlug(slug: string): string | undefined {
  return getPostIndex().bySlug.get(slug)?.slug
}
export function getPostRouteSlugs(): string[] {
  return [...getPostIndex().bySlug.keys()]
}

/** This assertion describes only the keys copied here, never a complete post. */
function select<P extends PostType, K extends keyof P>(post: P, fields: readonly K[]): SelectedPost<P, K> {
  return Object.fromEntries(fields.map(field => [field, post[field]])) as unknown as SelectedPost<P, K>
}

export function getPostBySlug<K extends keyof PostType>(slug: string, fields: readonly K[]) {
  const post = getPostIndex().bySlug.get(slug.replace(/\.md$/, ''))
  if (!post) throw new Error(`Post not found: ${slug}`)
  return select(post.data, fields)
}
export function getAllPosts<K extends keyof PostType>(fields: readonly K[]) {
  return getSortedPosts().map(post => select(post, fields))
}
export function getNotePosts<K extends keyof NotePost>(fields: readonly K[]) {
  return getSortedPosts().filter((post): post is NotePost => post.category !== 'photo').map(post => select(post, fields))
}
export function getRecentPosts<K extends keyof PostType>(count: number, fields: readonly K[]) {
  return getSortedPosts().slice(0, count).map(post => select(post, fields))
}
export function getPhotoPosts<K extends keyof PhotoPost>(fields: readonly K[]) {
  return getSortedPosts().filter((post): post is PhotoPost => post.category === 'photo').map(post => select(post, fields))
}
