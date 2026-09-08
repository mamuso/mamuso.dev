import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import test from 'node:test'
import sharp from 'sharp'
import { readPostIndex } from '../lib/post-index.ts'

// Run after pnpm build. This starts an isolated production server, never the dev server.
const port = process.env.METADATA_TEST_PORT || '3101'
const origin = `http://localhost:${port}`
const publishedOrigin = 'https://mamuso.dev'
const decode = (value) => value.replace(/&(?:amp|quot|apos|lt|gt|#(\d+)|#x([\da-f]+));/gi, (entity, decimal, hex) =>
  decimal ? String.fromCodePoint(Number(decimal)) : hex ? String.fromCodePoint(parseInt(hex, 16)) :
    ({ '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' })[entity])

function tags(html) {
  const result = new Map()
  for (const tag of html.matchAll(/<(?:meta|link)\s[^>]*>/g)) {
    const attrs = Object.fromEntries([...tag[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value)]))
    const key = attrs.property || attrs.name || attrs.rel
    if (!key) continue
    assert.ok(!result.has(key) || !['canonical', 'description', 'og:url', 'og:image', 'twitter:image', 'twitter:card'].includes(key), `Duplicate ${key}`)
    result.set(key, attrs.content ?? attrs.href)
  }
  return result
}

async function parallel(items, work) {
  const queue = [...items]
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) await work(queue.shift())
  }))
}

test('production pages publish canonical metadata and working social images', { timeout: 240_000 }, async (t) => {
  let log = ''
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', port], { stdio: ['ignore', 'pipe', 'pipe'] })
  const exited = once(server, 'exit')
  server.stdout.on('data', (data) => { log += data })
  server.stderr.on('data', (data) => { log += data })
  t.after(async () => {
    if (server.exitCode === null) server.kill('SIGTERM')
    await exited
  })
  for (let attempt = 0; !log.includes('Ready in'); attempt++) {
    assert.ok(server.exitCode === null && attempt < 100, `Production server did not start: ${log}`)
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  const { posts, bySlug } = readPostIndex()
  const notes = posts.filter((post) => post.data.category !== 'photo')
  const stacks = [...new Set(posts.map((post) => post.data.photoStack).filter(Boolean))]
  const pages = ['/', '/photos', '/notes', ...Array.from({ length: Math.ceil(notes.length / 20) }, (_, i) => `/notes/${i + 1}`)]
  const entries = [
    ...pages.map((path) => ({ path })),
    ...posts.map((post) => ({ path: `/note/${post.slug}`, photo: post.data.category === 'photo' ? post.data.basename : undefined })),
    ...stacks.map((stack) => ({ path: `/photos/stack/${encodeURIComponent(stack)}`, collection: true })),
  ]
  const images = new Set()
  await parallel(entries, async ({ path, photo, collection }) => {
    const response = await fetch(`${origin}${path}`, { headers: { 'user-agent': 'Twitterbot/1.0' }, redirect: 'manual' })
    assert.equal(response.status, 200, path)
    const metadata = tags(await response.text())
    assert.equal(new URL(metadata.get('canonical')).href, `${publishedOrigin}${path}`, path)
    assert.equal(new URL(metadata.get('og:url')).href, `${publishedOrigin}${path}`, path)
    assert.equal(metadata.get('og:site_name'), 'mamuso.dev', path)
    assert.ok(metadata.get('description') && metadata.get('description') !== '[object Object]', path)
    assert.equal(metadata.get('twitter:card'), 'summary_large_image', path)
    const image = metadata.get('og:image')
    assert.ok(image, path)
    assert.equal(metadata.get('twitter:image'), image, path)
    assert.equal(new URL(image).origin, publishedOrigin, path)
    if (photo) assert.equal(new URL(image).pathname, `/assets/feed/${encodeURIComponent(photo)}`, path)
    if (collection) assert.ok(new URL(image).pathname.startsWith('/assets/feed/'), path)
    images.add(image)
  })
  await parallel([...images], async (image) => {
    const url = new URL(image)
    const response = await fetch(`${origin}${url.pathname}${url.search}`)
    assert.equal(response.status, 200, image)
    assert.match(response.headers.get('content-type') || '', /^image\//, image)
    const dimensions = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
    assert.ok(dimensions.width > 0 && dimensions.height > 0, image)
  })
  for (const [alias, post] of bySlug) {
    if (alias === post.slug) continue
    const response = await fetch(`${origin}/note/${alias}`, { redirect: 'manual' })
    assert.equal(response.status, 308, alias)
    assert.equal(new URL(response.headers.get('location'), origin).pathname, `/note/${post.slug}`, alias)
  }
  for (const title of ['Mouse on / Mouse off', 'Reading? #1', '"Hello" & <world>', 'Muñoz — 日本語']) {
    const response = await fetch(`${origin}/og?${new URLSearchParams({ title, description: 'Quotes, /, ?, # and Unicode' })}`)
    assert.equal(response.status, 200, title)
    const dimensions = await sharp(Buffer.from(await response.arrayBuffer())).metadata()
    assert.equal(dimensions.width, 1200, title)
    assert.equal(dimensions.height, 600, title)
  }
  t.diagnostic(`Verified ${entries.length} pages, ${images.size} social images, filename redirects and special characters.`)
})
