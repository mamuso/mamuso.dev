import { BLOG_URL } from '@/lib/constants'
import { Post } from '@/lib/types'
import Link from 'next/link'
import Image from 'next/image'
import Markdown from 'markdown-to-jsx'

export default function DetailPost({ post }: { post: Post }) {
  return (
    <article>
      {post.image && <Image src={`/assets/feed/${post.slug}.${post.image.format}`} width={post.image.width} height={post.image.height} alt={post.title} />}
      {post.category != 'note' && (
        <>
          <h2>{post.title}</h2>
        </>
      )}
      <time dateTime={post.date}>{new Date(`${post.date}T00:00:00`).toLocaleDateString('en-us', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</time>
      <Markdown>{post.content}</Markdown>
    </article>
  )
}
