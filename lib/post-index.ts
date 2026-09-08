import fs from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'
import { validatePost } from './content-validation.ts'

export function readPostIndex(directory = join(process.cwd(), 'content/posts'), assetsDirectory = join(directory, '../assets/feed')) {
  const posts = fs.readdirSync(directory)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const fileSlug = file.slice(0, -3)
      let parsed: ReturnType<typeof matter>
      try { parsed = matter(fs.readFileSync(join(directory, file), 'utf8')) }
      catch (error) { throw new Error(`${file}: invalid frontmatter: ${error instanceof Error ? error.message : error}`) }
      const { data, content } = parsed
      const slug = data.slug === undefined ? fileSlug : data.slug
      if (data.slug !== undefined && (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) {
        throw new Error(`Invalid slug in ${file}`)
      }
      return { fileSlug, slug: slug as string, data: validatePost(data, file, slug, content, assetsDirectory), content }
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
  const stacks = new Map<string, { title: string; file: string }>()
  for (const post of posts) {
    const { photoStack, photoStackTitle } = post.data
    if (!photoStack) continue
    const previous = stacks.get(photoStack)
    if (previous && previous.title !== photoStackTitle) {
      throw new Error(`${post.fileSlug}.md: conflicting photoStackTitle for "${photoStack}"; differs from ${previous.file}`)
    }
    stacks.set(photoStack, { title: photoStackTitle!, file: `${post.fileSlug}.md` })
  }
  return { posts, bySlug }
}
