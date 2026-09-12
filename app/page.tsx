import { randomInt } from 'node:crypto'
import { pageMetadata } from '@/lib/metadata'
import Link from 'next/link'
import { getNotePosts, getPhotoPosts } from '@/lib/api'
import PostHome from '@/app/components/PostHome'
import HomeContent from '@/app/components/HomeContent'
import HomePhotos from '@/app/components/HomePhotos'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '@/app/styles/site'
import { colors } from './styles/tokens.stylex'
import { getRandomFact } from '@/lib/random-fact'

export const metadata = pageMetadata({ title: 'mamuso - manuel muñoz solera', path: '/' })
// The random fact and photo selection stay stable until the homepage revalidates.
export const revalidate = 180

export default function Home() {
  const notes = getNotePosts(['title', 'date', 'slug']).slice(0, 5)
  const photos = getPhotoPosts(['basename', 'width', 'height'])
  // Sample without replacement, leaving the cached post index untouched.
  const randomPhotos = Array.from({ length: Math.min(8, photos.length) }, () =>
    photos.splice(randomInt(photos.length), 1)[0])

  return (
    <>
      <HomeContent randomFact={getRandomFact()} />
      <div {...stylex.props(styles.content)}>
        <section aria-labelledby="home-notes" {...stylex.props(styles.block, styles.feed)}>
          <h2 id="home-notes" {...stylex.props(typography.display, typography.muted, styles.heading)}>Probably not thinking about you</h2>
          <ul {...stylex.props(layout.list, styles.notes)}>
            {notes.map(note => (
              <li key={note.slug}>
                <PostHome post={note} />
              </li>
            ))}
            <li {...stylex.props(styles.allNotes)}><Link href="/notes" {...stylex.props(styles.allNotesLink)}>Anyway, more notes →</Link></li>
          </ul>
        </section>
        <section aria-labelledby="home-photos" {...stylex.props(styles.block)}>
          <HomePhotos photos={randomPhotos} />
        </section>
      </div>
    </>
  )
}

const styles = stylex.create({
  content: {
    borderTopColor: colors.rule,
    borderTopStyle: 'solid',
    borderTopWidth: 1,
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@media (min-width: 880px)': 'repeat(2, minmax(0, 1fr))',
    },
    paddingBlockEnd: { default: 0, '@media (min-width: 880px)': 32 },
  },
  block: {
    minWidth: 0,
  },
  feed: {
    paddingBlockStart: 64,
    paddingBlockEnd: 32,
    paddingInlineEnd: { default: 0, '@media (min-width: 880px)': 32 },
  },
  heading: {
    fontWeight: 400,
    marginBlock: 0,
  },
  notes: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBlockStart: 32,
  },
  allNotes: {
    marginBlockStart: 24,
  },
  allNotesLink: {
    color: colors.textMuted,
    textDecorationLine: { default: 'none', ':focus-visible': 'underline' },
    textUnderlineOffset: 3,
  },
})
