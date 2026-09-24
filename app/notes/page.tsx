import { groupNoteYears } from '@/lib/note-years'
import BlankNoteYear from '@/app/components/BlankNoteYear'
import { colors } from '../styles/tokens.stylex'
import { pageMetadata } from '@/lib/metadata'
import { BLOG_TITLE } from '@/lib/constants'
import { getNotePosts } from '@/lib/api'
import PostHome from '@/app/components/PostHome'
import * as stylex from '@stylexjs/stylex'
import { layout } from '@/app/styles/site'

export const metadata = pageMetadata({ title: `Notes – ${BLOG_TITLE}`, path: '/notes' })

export default async function Posts() {
  const allPosts = await getNotePosts(['title', 'date', 'slug', 'category'])
  const groups = groupNoteYears(allPosts)

  return (
    <section {...stylex.props(layout.section, styles.section)}>
      <header {...stylex.props(styles.header, styles.rule)}>
        <h2 {...stylex.props(styles.heading)}>Feed</h2>
      </header>
      {groups.map(({ year, notes }, index) => notes.length ? (
        <section key={year} aria-labelledby={`notes-${year}`} {...stylex.props(styles.yearGroup)}>
          <h3 id={`notes-${year}`} {...stylex.props(styles.heading, styles.yearHeading, styles.rule)}>{year}</h3>
          <ul {...stylex.props(layout.list)}>
            {notes.map(post => (
              <li key={post.slug} {...stylex.props(styles.rule)}>
                <PostHome post={post} />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div key={year}>
          {(index === 0 || groups[index - 1].notes.length > 0) && (
            <div aria-hidden="true" {...stylex.props(styles.yearGroup, styles.heading, styles.yearHeading, styles.rule)}>
              {'\u00a0'}
            </div>
          )}
          <div {...stylex.props(styles.rule)}>
            <BlankNoteYear year={year} />
          </div>
        </div>
      ))}
    </section>
  )
}

const styles = stylex.create({
  section: {
    color: colors.textPrimary,
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
  yearGroup: {
    marginBlockStart: 32,
  },
  yearHeading: {
    paddingBlock: 4,
  },
  rule: {
    borderBlockEndColor: colors.rule,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 0.5,
  },
})
