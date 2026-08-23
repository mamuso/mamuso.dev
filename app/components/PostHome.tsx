import type { Post } from '@/lib/types'
import { formatPostDate } from '@/lib/constants'
import Link from 'next/link'

export default function PostHome({ post }: { post: Pick<Post, 'title' | 'date' | 'slug'> }) {
  return (
    <Link href={`/note/${post.slug}`}>
      {post.title} — <time dateTime={post.date}>{formatPostDate(post.date)}</time>
    </Link>
  )
}
