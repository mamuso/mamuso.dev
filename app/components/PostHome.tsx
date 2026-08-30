import { PostType } from '@/lib/types'
import { formatPostDate } from '@/lib/constants'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { typography } from '../styles/site'

export default function PostHome({ post }: { post: PostType }) {
  return (
    <Link href={`/note/${post.slug}`} {...stylex.props(typography.link, styles.row)}>
      <span>{post.title}</span>
      <time dateTime={post.date} {...stylex.props(typography.muted, styles.date)}>
        {formatPostDate(post.date)}
      </time>
    </Link>
  )
}

const styles = stylex.create({
  row: {
    alignItems: 'baseline',
    display: 'flex',
    gap: 24,
    justifyContent: 'space-between',
  },
  date: {
    flexShrink: 0,
  },
})
