import fs from 'fs'
import RSS from 'rss'
import path from 'path'
import { marked } from 'marked'
import matter from 'gray-matter'
import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '../lib/constants'

const posts = fs
  .readdirSync(path.resolve(__dirname, '../content/posts/'))
  .filter((file) => path.extname(file) === '.md' || path.extname(file) === '.mdx')
  .map((file) => {
    const postContent = fs.readFileSync(`./content/posts/${file}`, 'utf8')
    const slug = file.replace(/\.md$/, '')
    const { data, content }: { data: any; content: string } = matter(postContent)
    return { ...data, slug: slug, body: content }
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

const renderer = new marked.Renderer()

renderer.link = (href, _, text) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`

marked.setOptions({
  mangle: false,
  headerIds: false,
  gfm: true,
  breaks: true,
  renderer,
})

const renderPost = (md: string) => marked.parse(md)

const main = () => {
  const feed = new RSS({
    title: `${BLOG_TITLE}`,
    site_url: `${BLOG_URL}`,
    feed_url: `${BLOG_URL}/feed.xml`,
    image_url: `${BLOG_URL}/images/og.png`,
    language: 'en',
    description: `${BLOG_SUBTITLE}`,
  })

  posts.forEach((post) => {
    const url = `${BLOG_URL}/post/${post.slug}`

    feed.item({
      title: post.title,
      description: renderPost(post.body),
      date: new Date(post?.date),
      author: 'Max Leiter',
      url,
      guid: url,
    })
  })

  const rss = feed.xml({ indent: true })
  fs.writeFileSync(path.join(__dirname, '../public/feed.xml'), rss)
}

main()
