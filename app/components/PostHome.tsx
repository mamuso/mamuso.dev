import { PostType } from '@/lib/types'
import { formatPostDate } from '@/lib/constants'
import Link from 'next/link'
import { SelectIcon } from './Icons'

export default function PostHome({ post }: { post: PostType }) {
  return (
    <Link href={`/note/${post.slug}`}>
      <SelectIcon category={post.category} />
      <strong>{post.title}</strong>
      <i></i>
      <time dateTime={post.date}>{formatPostDate(post.date)}</time>
    </Link>
  )
}
