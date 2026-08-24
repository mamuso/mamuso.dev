import fs from 'fs-extra'
import { Feed } from 'feed'
import path from 'path'
import { marked } from 'marked'
import { getAllPosts } from './api'
import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE, parsePostDate } from './constants'
import type { Post } from './types'

export type FeedPost = Pick<Post, 'slug' | 'content' | 'title' | 'date' | 'basename'>

const FEED_FIELDS = ['slug', 'content', 'title', 'date', 'basename'] as const
const FEED_URL = `${BLOG_URL}/feed.xml`

const renderer = new marked.Renderer()

// Configure Markdown rendering.
marked.use({
  async: false,
  pedantic: false,
  gfm: true,
  breaks: true,
  renderer,
})

const renderPost = (markdown: string): string => `${marked.parse(markdown)}`

export function generateAtomFeed(posts: FeedPost[] = getAllPosts(FEED_FIELDS)): string {
  if (posts.length === 0) throw new Error('Cannot generate an Atom feed without posts')

  const sortedPosts = [...posts].sort((a, b) => {
    const dateOrder = parsePostDate(b.date).getTime() - parsePostDate(a.date).getTime()
    return dateOrder || a.slug.localeCompare(b.slug)
  })
  const updated = parsePostDate(sortedPosts[0].date)

  const feed = new Feed({
    title: BLOG_TITLE,
    description: BLOG_SUBTITLE,
    id: BLOG_URL,
    link: BLOG_URL,
    updated,
    image: `${BLOG_URL}/images/favicon.png`,
    favicon: `${BLOG_URL}/images/favicon.png`,
    copyright: `${updated.getUTCFullYear()}, mamuso`,
    generator: 'mamuso.dev',
    language: 'en',
    feedLinks: {
      atom: FEED_URL,
    },
    author: {
      name: 'Manuel Muñoz Solera',
      email: 'mamuso@mamuso.net',
    },
  })

  sortedPosts.forEach((post) => {
    const url = `${BLOG_URL}/note/${post.slug}`
    const image = post.basename
      ? `<img src="${BLOG_URL}/assets/feed/${post.basename}" alt="" />`
      : ''
    const description = image + renderPost(post.content).replace(
      /(["'])\/assets\//g,
      `$1${BLOG_URL}/assets/`
    )

    feed.addItem({
      id: url,
      title: post.title,
      description,
      date: parsePostDate(post.date),
      author: [
        {
          name: 'Manuel Muñoz Solera',
        },
      ],
      link: url,
    })
  })

  return feed.atom1()
}

export function writeAtomFeed(outputPath = path.resolve(process.cwd(), 'public/feed.xml')): void {
  fs.writeFileSync(outputPath, generateAtomFeed())
}

if (require.main === module) writeAtomFeed()
