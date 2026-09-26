import { cacheLife } from 'next/cache'
import type { PostType, PhotoPost, NotePost, SelectedPost } from './types'
import { readPostIndex } from './post-index'

async function getPostIndex() {
  'use cache'
  cacheLife('max')
  return readPostIndex()
}
async function getSortedPosts() {
  return (await getPostIndex()).posts.map(post => post.data)
    .sort((a, b) => a.date > b.date ? -1 : a.date < b.date ? 1 : 0)
}

export async function resolvePostSlug(slug: string): Promise<string | undefined> {
  return (await getPostIndex()).bySlug.get(slug)?.slug
}
export async function getPostRouteSlugs(): Promise<string[]> {
  return [...(await getPostIndex()).bySlug.keys()]
}

/** This assertion describes only the keys copied here, never a complete post. */
function select<P extends PostType, K extends keyof P>(post: P, fields: readonly K[]): SelectedPost<P, K> {
  return Object.fromEntries(fields.map(field => [field, post[field]])) as unknown as SelectedPost<P, K>
}

export async function getPostBySlug<K extends keyof PostType>(slug: string, fields: readonly K[]) {
  const post = (await getPostIndex()).bySlug.get(slug.replace(/\.md$/, ''))
  if (!post) throw new Error(`Post not found: ${slug}`)
  return select(post.data, fields)
}
export async function getAllPosts<K extends keyof PostType>(fields: readonly K[]) {
  return (await getSortedPosts()).map(post => select(post, fields))
}
export async function getNotePosts<K extends keyof NotePost>(fields: readonly K[]) {
  return (await getSortedPosts()).filter((post): post is NotePost => post.category !== 'photo').map(post => select(post, fields))
}
export async function getRecentPosts<K extends keyof PostType>(count: number, fields: readonly K[]) {
  return (await getSortedPosts()).slice(0, count).map(post => select(post, fields))
}
export async function getPhotoPosts<K extends keyof PhotoPost>(fields: readonly K[]) {
  return (await getSortedPosts()).filter((post): post is PhotoPost => post.category === 'photo').map(post => select(post, fields))
}
