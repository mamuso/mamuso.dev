import fs from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'

export function readPostIndex(directory = join(process.cwd(), 'content/posts')) {
  const posts = fs.readdirSync(directory)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const fileSlug = file.slice(0, -3)
      const { data, content } = matter(fs.readFileSync(join(directory, file), 'utf8'))
      const slug = data.slug ?? fileSlug
      if (data.slug !== undefined && (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) {
        throw new Error(`Invalid slug in ${file}`)
      }
      return { fileSlug, slug: slug as string, data, content }
    })

  const bySlug = new Map<string, (typeof posts)[number]>()
  for (const post of posts) {
    for (const slug of new Set([post.fileSlug, post.slug])) {
      const existing = bySlug.get(slug)
      if (existing) {
        throw new Error(`Duplicate slug "${slug}" in ${existing.fileSlug}.md and ${post.fileSlug}.md`)
      }
      bySlug.set(slug, post)
    }
  }
  return { posts, bySlug }
}
