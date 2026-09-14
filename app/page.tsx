import { randomInt } from 'node:crypto'
import { pageMetadata } from '@/lib/metadata'
import Link from 'next/link'
import { getNotePosts, getPhotoPosts } from '@/lib/api'
import PostHome from '@/app/components/PostHome'
import HomeContent from '@/app/components/HomeContent'
import HomePhotos from '@/app/components/HomePhotos'
import { selectHomePhotos } from '@/app/components/homePhotoComposition'
import * as stylex from '@stylexjs/stylex'
import { layout } from '@/app/styles/site'
import { colors } from './styles/tokens.stylex'
import { getRandomFact } from '@/lib/random-fact'

export const metadata = pageMetadata({ title: 'mamuso - manuel muñoz solera', path: '/' })
// The random fact and photo selection stay stable until the homepage revalidates.
export const revalidate = 180

export default function Home() {
  const notes = getNotePosts(['title', 'date', 'slug']).slice(0, 5)
  const photos = getPhotoPosts(['basename', 'width', 'height'])
  const randomPhotos = selectHomePhotos(photos, randomInt)

  return (
    <>
      <HomeContent randomFact={getRandomFact()} />
      <div {...stylex.props(styles.content)}>
        <section aria-labelledby="home-fun" {...stylex.props(styles.block, styles.fun)}>
          <h2 id="home-fun" {...stylex.props(styles.heading)}>Having fun</h2>
        </section>
        <section aria-labelledby="home-notes" {...stylex.props(styles.block, styles.notesModule)}>
          <h2 id="home-notes" {...stylex.props(styles.heading)}>Probably not thinking about you</h2>
          <ul {...stylex.props(layout.list, styles.notes)}>
            {notes.map(note => (
              <li key={note.slug}>
                <PostHome post={note} />
              </li>
            ))}
            <li {...stylex.props(styles.allNotes)}><Link href="/notes" {...stylex.props(styles.allNotesLink)}>Anyway, more notes →</Link></li>
          </ul>
        </section>
        <section aria-labelledby="home-photos" {...stylex.props(styles.photos)}>
          <HomePhotos photos={randomPhotos} />
        </section>
      </div>
    </>
  )
}

const styles = stylex.create({
  content: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@media (min-width: 880px)': 'repeat(2, minmax(0, 1fr))',
    },
    gridTemplateAreas: {
      default: '"fun" "notes" "photos"',
      '@media (min-width: 880px)': '"fun notes" "fun photos"',
    },
    gap: 20,
    paddingBlockEnd: 32,
  },
  block: {
    minWidth: 0,
    backgroundColor: '#F8F8F8',
    borderRadius: 24,
    overflow: 'hidden',
    paddingBlock: 24,
    paddingInline: 24,
  },
  fun: {
    gridArea: 'fun',
    minHeight: { default: 300, '@media (min-width: 880px)': 0 },
  },
  notesModule: {
    gridArea: 'notes',
  },
  photos: {
    gridArea: 'photos',
    minWidth: 0,
  },
  heading: {
    fontSize: 18,
    lineHeight: '24px',
    color: colors.textPrimary,
    textAlign: 'left',
    fontWeight: 400,
    margin: 0,
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
