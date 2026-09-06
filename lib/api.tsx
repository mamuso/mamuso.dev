import { cache } from 'react'
import { PostType } from './types'
import { readPostIndex } from './post-index'

const getPostIndex = cache(() => readPostIndex())

const getPostSlugs = cache(() => getPostIndex().posts.map((post) => post.slug))

export function resolvePostSlug(slug: string): string | undefined {
  return getPostIndex().bySlug.get(slug)?.slug
}

export function getPostRouteSlugs(): string[] {
  return [...getPostIndex().bySlug.keys()]
}

// Cache raw file read per request to avoid duplicate filesystem reads
const getPostData = cache((slug: string) => {
  const post = getPostIndex().bySlug.get(slug.replace(/\.md$/, ''))
  if (!post) throw new Error(`Post not found: ${slug}`)
  return { realSlug: post.slug, data: post.data, content: post.content }
})

type PostSummary = { slug: string; date: string }

const getSortedPostSummaries = cache((): PostSummary[] => {
  return getPostSlugs()
    .map((slug) => {
      const { realSlug, data } = getPostData(slug)
      return { slug: realSlug, date: data.date as string }
    })
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1))
})

export function getPostBySlug(slug: string, fields: string[] = []): PostType {
  const { realSlug, data, content } = getPostData(slug)
  const items: Record<string, unknown> = {}

  // Ensure only the minimal needed data is exposed
  fields.forEach((field) => {
    if (field === 'slug') {
      items[field] = realSlug
    }
    if (field === 'content') {
      items[field] = content
    }

    if (data[field] !== undefined) {
      items[field] = data[field]
    }
  })

  return items as unknown as PostType
}

export function getAllPosts(fields: string[]): PostType[] {
  return getSortedPostSummaries().map(({ slug }) => getPostBySlug(slug, fields))
}

export function getNotePosts(fields: string[]): PostType[] {
  // Writing includes legacy code posts and entries without a category.
  return getSortedPostSummaries()
    .filter(({ slug }) => getPostData(slug).data.category !== 'photo')
    .map(({ slug }) => getPostBySlug(slug, fields))
}

export function getRecentPosts(count: number, fields: string[]): PostType[] {
  return getSortedPostSummaries()
    .slice(0, count)
    .map(({ slug }) => getPostBySlug(slug, fields))
}

export function getPhotoPosts(fields: string[]): PostType[] {
  return getPostSlugs()
    .filter((slug) => getPostData(slug).data.category === 'photo')
    .sort((slugA, slugB) => {
      const dateA = getPostData(slugA).data.date as string
      const dateB = getPostData(slugB).data.date as string
      return dateA > dateB ? -1 : 1
    })
    .map((slug) => getPostBySlug(slug, fields))
}
