import { readCheckedContent } from '../lib/content-check.ts'

try {
  const { posts, bySlug } = readCheckedContent()
  const photos = posts.filter(post => post.data.category === 'photo')
  const stacks = new Set(photos.map(post => post.data.photoStack).filter(Boolean))
  console.log(`Content OK: ${posts.length} posts, ${photos.length} photos, ${stacks.size} stacks, ${bySlug.size} canonical/alias routes.`)
} catch (error) {
  console.error(`Content check failed: ${error.message}`)
  process.exitCode = 1
}
