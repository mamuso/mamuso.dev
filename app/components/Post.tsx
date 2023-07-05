import { BLOG_URL } from '@/lib/constants'
import { PostType } from '@/lib/types'
import Link from 'next/link'
import Image from 'next/image'
import Markdown from 'markdown-to-jsx'

export default function Post({ post }: { post: PostType }) {
  return (
    <article>
      <h2>{post.title}</h2>
      <time dateTime={post.date}>{new Date(`${post.date}T00:00:00`).toLocaleDateString('en-us', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</time>
      {post.basename && <Image src={`/assets/feed/${post.basename}`} width={post.width} height={post.height} alt={post.title} />}
      <Markdown>{post.content}</Markdown>
    </article>
  )
}
