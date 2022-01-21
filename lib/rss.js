import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '../lib/constants'
import marked from 'marked'

export async function generateRssItem(post) {
  let content = marked(post.content)
  content += `<p><img src='${BLOG_URL}/_feed/${post.slug}.${post.image.format}'/></p>`

  return `
    <item>
      <guid>${BLOG_URL}/post/${post.slug}</guid>
      <title>${post.title}</title>
      <description><![CDATA[${content}]]></description>
      <link>${BLOG_URL}/post/${post.slug}</link>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>
  `
}

export async function generateRss(posts) {
  const itemsList = await Promise.all(posts.map(generateRssItem))

  return `
    <rss xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" version="2.0">
      <channel>
        <title>${BLOG_TITLE}</title>
        <link>${BLOG_URL}</link>
        <description>${BLOG_SUBTITLE}</description>
        <language>en</language>
        <lastBuildDate>${new Date(posts[0].date).toUTCString()}</lastBuildDate>
        <image>
          <url>${BLOG_URL}/img/favicon.png</url>
          <title>${BLOG_TITLE}</title>
          <link>${BLOG_URL}</link>
        </image>
        <atom:link href="${BLOG_URL}" rel="self" type="application/rss+xml"/>
        ${itemsList.join('')}
      </channel>
    </rss>
  `
}
