import { PostType } from '@/lib/types'
import Link from 'next/link'
import { SelectIcon } from './Icon'

export default function PostHome({ post }: { post: PostType }) {
  return (
    <Link href={`/post/${post.slug}`}>
      <SelectIcon category={post.category} />
      <strong>{post.title}</strong>
      <i></i>
      <time dateTime={post.date}>{new Date(`${post.date}T00:00:00`).toLocaleDateString('en-us', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</time>
    </Link>
  )
}
