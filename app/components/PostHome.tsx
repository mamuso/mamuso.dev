import { PostType } from '@/lib/types'
import { formatPostDate } from '@/lib/constants'
import Link from 'next/link'

export default function PostHome({ post }: { post: PostType }) {
  return (
    <Link href={`/note/${post.slug}`}>
      {post.title} — <time dateTime={post.date}>{formatPostDate(post.date)}</time>
    </Link>
  )
}
