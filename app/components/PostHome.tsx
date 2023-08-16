import { PostType } from '@/lib/types'
import Link from 'next/link'
import { SelectIcon } from './Icons'

export default function PostHome({ post }: { post: PostType }) {
  return (
    <Link href={`/post/${post.slug}`}>
      <SelectIcon category={post.category} />
      <strong>{post.title}</strong>
      <i></i>
      <time dateTime={post.date}>{new Date(`${post.date}T00:00:00`).toLocaleDateString('en-us', { year: 'numeric', month: 'short', day: 'numeric' })}</time>
    </Link>
  )
}
