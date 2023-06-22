import { Post } from '@/lib/types'
import Link from 'next/link'
import Markdown from 'markdown-to-jsx'

export default function DetailPost({ post }: { post: Post }) {
  return (
    <article>
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
