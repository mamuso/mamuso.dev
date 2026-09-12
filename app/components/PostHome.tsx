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
      <span aria-hidden="true" {...stylex.props(styles.leader)} />
      <time dateTime={post.date} {...stylex.props(typography.muted, styles.date)}>
        {formatPostMonth(post.date)}
      </time>
    </Link>
  )
}

const styles = stylex.create({
  note: {
    paddingBlock: 6,
    paddingInline: 12,
    marginBlock: -4,
    marginInline: -12,
    borderRadius: 6,
    transitionProperty: 'background-color',
    transitionDuration: { default: '120ms', '@media (prefers-reduced-motion: reduce)': '0ms' },
    transitionTimingFunction: 'ease-out',
    backgroundColor: {
      default: 'transparent',
      ':hover': 'rgba(24, 24, 27, 0.04)',
      ':focus-visible': 'rgba(24, 24, 27, 0.04)',
    },
    display: 'flex',
    alignItems: 'center',
    lineHeight: '20px',
    gap: 16,
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
  leader: {
    flex: '1 0 16px',
    borderBottomColor: colors.textMuted,
    borderBottomStyle: 'dashed',
    opacity: 0.4,
    borderBottomWidth: 1,
    alignSelf: 'center',
  },
  date: {
    fontSize: 14,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
})
