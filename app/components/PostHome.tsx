import type { PostSummary } from '@/lib/types'
import { formatPostMonth } from '@/lib/editorial-date'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { typography } from '../styles/site'

export default function PostHome({ post }: { post: PostSummary }) {
  return (
    <Link href={`/note/${post.slug}`} {...stylex.props(typography.link, styles.note)}>
      <span title={post.title} {...stylex.props(styles.noteTitle)}>{post.title}</span>
      <time dateTime={post.date} {...stylex.props(styles.date)}>
        {formatPostMonth(post.date)}
      </time>
    </Link>
  )
}

const styles = stylex.create({
  note: {
    color: {
      default: '#17181B',
      ':hover': 'rgba(23, 24, 27, 0.4)',
    },
    fontSize: 16,
    fontWeight: 400,
    letterSpacing: '-0.005em',
    paddingBlock: 5,
    display: 'flex',
    alignItems: 'center',
    lineHeight: '22px',
    gap: 12,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  noteTitle: {
    color: '#17181B',
    fontWeight: 400,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexShrink: 1,
  },
  date: {
    color: 'rgba(23, 24, 27, 0.4)',
    fontSize: 16,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
})
