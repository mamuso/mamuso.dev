import { groupNoteYears } from '@/lib/note-years'
import BlankNoteYear from '@/app/components/BlankNoteYear'
import { colors } from '../styles/tokens.stylex'
import { pageMetadata } from '@/lib/metadata'
import { BLOG_TITLE } from '@/lib/constants'
import { getNotePosts } from '@/lib/api'
import PostHome from '@/app/components/PostHome'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { layout } from '@/app/styles/site'

export const metadata = pageMetadata({ title: `Notes – ${BLOG_TITLE}`, path: '/notes' })

const allPosts = getNotePosts(['title', 'date', 'slug', 'category'])

export default function Posts() {
  const groups = groupNoteYears(allPosts)

  return (
    <section {...stylex.props(layout.section, styles.section)}>
      <header {...stylex.props(styles.header, styles.rule)}>
        <h2 {...stylex.props(styles.heading)}>Probably not thinking about you</h2>
        <Link href="/notes/1" {...stylex.props(styles.expand)}>Expand all notes ↓</Link>
      </header>
      <ul {...stylex.props(layout.list)}>
        {groups.flatMap(({ year, notes }) => notes.length ? notes.map(post => (
          <li key={post.slug} {...stylex.props(styles.rule)}>
            <PostHome post={post} />
          </li>
        )) : [
          <li key={year} {...stylex.props(styles.rule)}>
            <BlankNoteYear year={year} />
          </li>,
        ])}
      </ul>
    </section>
  )
}

const styles = stylex.create({
  section: {
    color: '#17181B',
    fontSize: 16,
    fontWeight: 400,
    letterSpacing: '-0.005em',
    lineHeight: '22px',
  },
  header: {
    alignItems: 'baseline',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 4,
    paddingBlock: 4,
  },
  heading: {
    fontSize: 18,
    fontWeight: 400,
    letterSpacing: '-0.005em',
    lineHeight: '24px',
    margin: 0,
  },
  expand: {
    color: {
      default: 'rgba(23, 24, 27, 0.4)',
      ':hover': 'rgba(23, 24, 27, 0.6)',
      ':focus-visible': 'rgba(23, 24, 27, 0.6)',
    },
    textDecorationLine: { default: 'none', ':focus-visible': 'underline' },
    textUnderlineOffset: 3,
    transitionProperty: 'color',
    transitionDuration: { default: '140ms', '@media (prefers-reduced-motion: reduce)': '0ms' },
    transitionTimingFunction: 'ease',
  },
  rule: {
    borderBlockEndColor: colors.rule,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 0.5,
  },
})
