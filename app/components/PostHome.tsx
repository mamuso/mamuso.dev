import { PostType } from '@/lib/types'
import { formatPostDate } from '@/lib/constants'
import Link from 'next/link'

export default function PostHome({ post }: { post: PostType }) {
  return (
    <Link href={`/note/${post.slug}`}>
      <strong>{post.title}</strong>
      <time dateTime={post.date}>{formatPostDate(post.date)}</time>
    </Link>
  )
}
