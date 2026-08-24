import assert from 'node:assert/strict'
import test from 'node:test'
import { BLOG_URL } from '../lib/constants'
import { generateAtomFeed, type FeedPost } from '../lib/feed'

const posts: FeedPost[] = [
  {
    slug: 'older-post',
    title: 'Older post',
    date: '2023-12-31',
    content: 'An [asset](/assets/posts/example.png).',
  },
  {
    slug: 'newer-post',
    title: 'Newer post',
    date: '2024-02-03',
    content: 'The latest entry.',
    basename: 'newer-post.jpg',
  },
  {
    slug: 'another-newer-post',
    title: 'Another newer post',
    date: '2024-02-03',
    content: 'Published on the same day.',
  },
]

test('Atom output uses canonical note URLs and an Atom self link', () => {
  const feed = generateAtomFeed(posts)

  assert.match(feed, new RegExp(`<link rel="self" href="${BLOG_URL}/feed.xml"`))
  assert.match(feed, new RegExp(`<id>${BLOG_URL}/note/newer-post</id>`))
  assert.match(feed, new RegExp(`${BLOG_URL}/assets/posts/example.png`))
  assert.doesNotMatch(feed, new RegExp(`${BLOG_URL}/post/`))
})

test('Atom output derives a stable updated timestamp from the newest post', () => {
  const first = generateAtomFeed(posts)
  const second = generateAtomFeed([...posts].reverse())

  assert.match(first, /<updated>2024-02-03T00:00:00.000Z<\/updated>/)
  assert.equal(first, second)
})

test('Atom generation rejects an empty content collection', () => {
  assert.throws(() => generateAtomFeed([]), /without posts/)
})
