import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/api'
import { BLOG_URL } from '@/lib/constants'
import { postPath } from '@/lib/post-path'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts(['slug', 'category', 'photoStack'])
  const stacks = new Set(posts
    .filter(post => post.category === 'photo')
    .map(post => post.photoStack)
    .filter((stack): stack is string => Boolean(stack)))

  return [
    ...['/', '/notes', '/photos'].map(path => ({ url: new URL(path, BLOG_URL).href })),
    ...posts.map(post => ({ url: new URL(postPath(post), BLOG_URL).href })),
    ...[...stacks].map(stack => ({ url: `${BLOG_URL}/photos/stack/${encodeURIComponent(stack)}` })),
  ]
}
