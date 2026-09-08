import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { readPostIndex } from './post-index.ts'

function fixture(t, entries) {
  const directory = mkdtempSync(join(tmpdir(), 'post-slugs-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  for (const [name, content] of Object.entries(entries)) {
    writeFileSync(join(directory, name), content)
  }
  return directory
}

test('canonical and legacy slugs resolve to the same photo, independently of its title', (t) => {
  const directory = fixture(t, {
    '2025-12-31-DSCF9496.md': '---\nslug: mirror\ntitle: A revised title\ncategory: photo\nbasename: original.jpg\n---\nCaption',
    'writing.md': '---\ntitle: Writing\n---\nA note',
  })
  const { posts, bySlug } = readPostIndex(directory)
  assert.equal(posts.length, 2)
  assert.equal(bySlug.get('mirror'), bySlug.get('2025-12-31-DSCF9496'))
  assert.equal(bySlug.get('mirror').data.basename, 'original.jpg')
  assert.equal(bySlug.get('writing').slug, 'writing')
  assert.equal(bySlug.get('../writing'), undefined)
  assert.equal(bySlug.get('missing'), undefined)
})

test('rejects duplicate canonical slugs and collisions with legacy URLs', (t) => {
  for (const second of ['slug: shared', 'slug: first']) {
    const directory = fixture(t, {
      'first.md': '---\nslug: shared\n---',
      'second.md': `---\n${second}\n---`,
    })
    assert.throws(() => readPostIndex(directory), /Duplicate slug/)
  }
})

test('rejects malformed explicit slugs', (t) => {
  for (const slug of ['../escape', '', 'two words', '/absolute', 123]) {
    const directory = fixture(t, { 'photo.md': `---\nslug: ${JSON.stringify(slug)}\n---` })
    assert.throws(() => readPostIndex(directory), /Invalid slug/)
  }
})

test('published canonical URLs and filename aliases resolve uniquely', () => {
  const { posts, bySlug } = readPostIndex()
  assert.equal(new Set(posts.map((post) => post.slug)).size, posts.length, 'Published canonical slugs must be unique')
  for (const post of posts) {
    assert.equal(bySlug.get(post.fileSlug), post, `Broken filename alias: ${post.fileSlug}`)
    assert.equal(bySlug.get(post.slug), post, `Broken canonical URL: ${post.slug}`)
    assert.match(post.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `Invalid published slug: ${post.slug}`)
  }
})
