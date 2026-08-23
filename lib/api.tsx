import fs from 'fs-extra'
import { join } from 'path'
import { cache } from 'react'
import type { Post } from './types'
import matter from 'gray-matter'
import { parsePostFrontmatter } from './post-frontmatter'

const postsDirectory = join(process.cwd(), 'content/posts/')
const safeSlugPattern = /^[A-Za-z0-9_-]+$/

const getPostSlugs = cache(() => fs.readdirSync(postsDirectory))

// Cache validated post reads per request to avoid duplicate filesystem work.
const getPost = cache((slug: string): Post => {
  const realSlug = slug.replace(/\.md$/, '')
  if (!safeSlugPattern.test(realSlug)) throw new TypeError(`Invalid post slug: ${slug}`)

  const fullPath = join(postsDirectory, `${realSlug}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)
  const frontmatter = parsePostFrontmatter(data, `Post ${realSlug}`)

  return { ...frontmatter, slug: realSlug, content }
})

type PostSummary = { slug: string; date: string }

const getSortedPostSummaries = cache((): PostSummary[] => {
  return getPostSlugs()
    .map((slug) => {
      const { slug: realSlug, date } = getPost(slug)
      return { slug: realSlug, date }
    })
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1))
})

export function hasPostSlug(slug: string): boolean {
  const realSlug = slug.replace(/\.md$/, '')
  return safeSlugPattern.test(realSlug) && fs.existsSync(join(postsDirectory, `${realSlug}.md`))
}

export function getPostBySlug<const K extends keyof Post>(
  slug: string,
  fields: readonly K[]
): Pick<Post, K> {
  return pickFields(getPost(slug), fields)
}

export function getAllPosts<const K extends keyof Post>(
  fields: readonly K[]
): Pick<Post, K>[] {
  return getSortedPostSummaries().map(({ slug }) => getPostBySlug(slug, fields))
}

export function getRecentPosts<const K extends keyof Post>(
  count: number,
  fields: readonly K[]
): Pick<Post, K>[] {
  return getSortedPostSummaries()
    .slice(0, count)
    .map(({ slug }) => getPostBySlug(slug, fields))
}

export function getPhotoPosts<const K extends keyof Post>(
  fields: readonly K[]
): Pick<Post, K>[] {
  return getPostSlugs()
    .filter((slug) => getPost(slug).category === 'photo')
    .sort((slugA, slugB) => {
      const dateA = getPost(slugA).date
      const dateB = getPost(slugB).date
      return dateA > dateB ? -1 : 1
    })
    .map((slug) => getPostBySlug(slug, fields))
}

function pickFields<T, K extends keyof T>(source: T, fields: readonly K[]): Pick<T, K> {
  const projection = {} as Pick<T, K>
  for (const field of fields) projection[field] = source[field]
  return projection
}
