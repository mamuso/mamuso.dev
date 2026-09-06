import fs from 'fs-extra'
import { Feed } from 'feed'
import path from 'path'
import { marked } from 'marked'
import { readPostIndex } from './post-index'
import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from './constants'

interface FeedPost {
  slug: string
  fileSlug: string
  body: string
  title: string
  date: string
  basename?: string
  [key: string]: unknown
}

const posts = readPostIndex().posts
  .filter(({ data }) => data.category !== 'photo')
  .map(({ data, content, slug, fileSlug }) => {
    return { ...data, slug, fileSlug, body: content } as FeedPost
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

const renderer = new marked.Renderer()

// Set options
marked.use({
  async: false,
  pedantic: false,
  gfm: true,
  breaks: true,
  renderer,
})

const renderPost = (md: string): string => `${marked.parse(md)}`

const main = () => {
  const feedOptions = {
    title: `${BLOG_TITLE}`,
    description: `${BLOG_SUBTITLE}`,
    id: `${BLOG_URL}`,
    link: `${BLOG_URL}`,
    image: `${BLOG_URL}/images/favicon.png`,
    icon: `${BLOG_URL}/images/favicon.ico`,
    logo: `${BLOG_URL}/images/favicon.png`,
    favicon: `${BLOG_URL}/images/favicon.png`,
    copyright: `${new Date().getFullYear()}, mamuso`,
    generator: 'mamuso.dev',
    language: 'en',
    feedLinks: {
      rss2: `${BLOG_URL}/feed.xml`,
    },
    author: {
      name: 'Manuel Muñoz Solera',
      email: 'mamuso@mamuso.net',
    },
  }

  const feed = new Feed(feedOptions)

  posts.forEach((post) => {
    const url = `${BLOG_URL}/note/${post.slug}`

    let description: string = post.basename ? `<img src='${BLOG_URL}/assets/feed/${post.basename}'/>` : ''
    description += renderPost(post.body)
      .replace(/\'\/assets\//g, "'" + `${BLOG_URL}` + '/assets/')
      .replace(/\"\/assets\//g, '"' + `${BLOG_URL}` + '/assets/')

    feed.addItem({
      // Keep the historical identity when changing an entry's public URL.
      id: `${BLOG_URL}/post/${post.fileSlug}`,
      title: post.title,
      description: description,
      date: new Date(post?.date),
      author: [
        {
          name: 'Manuel Muñoz Solera',
        },
      ],
      link: url,
    })
  })

  const rss = feed.atom1()
  fs.writeFileSync(path.join(__dirname, '../public/feed.xml'), rss)
}

main()
