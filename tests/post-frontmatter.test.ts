import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import matter from 'gray-matter'
import { getPostBySlug } from '../lib/api'
import { parsePostFrontmatter } from '../lib/post-frontmatter'

test('all post frontmatter matches the validated schema', () => {
  const postsDirectory = path.join(process.cwd(), 'content/posts')
  const files = fs.readdirSync(postsDirectory).filter((file) => /\.mdx?$/.test(file))

  for (const file of files) {
    const source = fs.readFileSync(path.join(postsDirectory, file), 'utf8')
    parsePostFrontmatter(matter(source).data, file)
  }

  assert.ok(files.length > 0)
})

test('photo metadata remains optional and invalid GPS placeholders are omitted', () => {
  const post = parsePostFrontmatter({
    title: 'Example post',
    date: '2024-01-01',
    GPSLatitude: 'NaN',
    GPSLongitude: 'NaN',
  })

  assert.equal(post.category, undefined)
  assert.equal(post.basename, undefined)
  assert.equal(post.GPSLatitude, undefined)
  assert.equal(post.GPSLongitude, undefined)
})

test('invalid required and optional fields are rejected', () => {
  assert.throws(() => parsePostFrontmatter({ date: '2024-01-01' }), /title is required/)
  assert.throws(
    () => parsePostFrontmatter({ title: 'Bad date', date: '2024-02-30' }),
    /date is invalid/
  )
  assert.throws(
    () => parsePostFrontmatter({ title: 'Bad category', date: '2024-01-01', category: 'draft' }),
    /supported category/
  )
  assert.throws(
    () => parsePostFrontmatter({ title: 'Bad width', date: '2024-01-01', width: '1200' }),
    /width must be a finite number/
  )
})

test('post queries accept safe underscore slugs and return only requested fields', () => {
  const post = getPostBySlug('2015-01-28-IMG_0486-hard-times-for-dreamers', [
    'slug',
    'title',
  ])

  assert.deepEqual(post, {
    slug: '2015-01-28-IMG_0486-hard-times-for-dreamers',
    title: 'Hard times for dreamers',
  })
  assert.throws(() => getPostBySlug('../package', ['slug']), /Invalid post slug/)
})
