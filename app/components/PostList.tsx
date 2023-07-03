import { PostType } from '@/lib/types'
import Link from 'next/link'
import Markdown from 'markdown-to-jsx'
import { SelectIcon } from './Icon'

export default function PostList({ post }: { post: PostType }) {
  return (
    <article>
      <h2>
        <Link href={`/post/${post.slug}`}>{post.title}</Link>
      </h2>
      {post.category === 'note' && <Markdown>{post.content}</Markdown>}
      <SelectIcon category={post.category} /> {post.category}
      {' · '}
      <time dateTime={post.date}>{new Date(`${post.date}T00:00:00`).toLocaleDateString('en-us', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</time>
    </article>
  )
}
