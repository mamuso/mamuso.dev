import type { PostSummary } from '@/lib/types'
import { formatPostMonth } from '@/lib/editorial-date'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { typography } from '../styles/site'
import { colors } from '../styles/tokens.stylex'

export default function PostHome({ post }: { post: PostSummary }) {
  return (
    <Link href={`/note/${post.slug}`} {...stylex.props(typography.link, styles.note)}>
      <span title={post.title} {...stylex.props(styles.noteTitle)}>{post.title}</span>
      <time dateTime={post.date} {...stylex.props(typography.muted, styles.date)}>
        {formatPostMonth(post.date)}
      </time>
    </Link>
  )
}

const styles = stylex.create({
  note: {
    paddingBlock: 4,
    display: 'flex',
    alignItems: 'center',
    lineHeight: '22px',
    gap: 12,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  noteTitle: {
    color: colors.textPrimary,
    fontWeight: 400,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexShrink: 1,
  },
  date: {
    fontSize: 14,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
})
