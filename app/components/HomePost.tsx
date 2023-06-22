import { Post } from '@/lib/types'
import Link from 'next/link'
import Markdown from 'markdown-to-jsx'

export default function HomePost({ key, post }: { key: number; post: Post }) {
  return (
    <article key={key}>
      {post.category != 'note' && (
        <>
          <h2>
            <Link href={`/post/${post.slug}`}>{post.title}</Link>
          </h2>
        </>
      )}
      {post.category === 'note' && <Markdown>{post.content}</Markdown>}
      <time dateTime={post.date}>{new Date(`${post.date}T00:00:00`).toLocaleDateString('en-us', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</time>
    </article>
  )
}
