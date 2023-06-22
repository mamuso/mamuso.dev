import { Post } from '@/lib/types'
import Link from 'next/link'
import Markdown from 'markdown-to-jsx'

export default function HomePost({ post }: { post: Post }) {
  return (
    <article>
      {post.category != 'note' && (
        <>
          <h2>
            <Link href={`/post/${post.slug}`}>{post.title}</Link>
          </h2>
        </>
      )}
      {post.category === 'note' && <Markdown>{post.content}</Markdown>}
      <Link href={`/post/${post.slug}`}>
        ☰ <time dateTime={post.date}>{new Date(`${post.date}T00:00:00`).toLocaleDateString('en-us', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</time>
      </Link>
    </article>
  )
}
