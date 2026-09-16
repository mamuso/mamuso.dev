import { pageMetadata } from '@/lib/metadata'
import Link from 'next/link'
import { getNotePosts } from '@/lib/api'
import PostHome from '@/app/components/PostHome'
import HomeContent from '@/app/components/HomeContent'
import { projects } from '@/data/projects'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '@/app/styles/site'
import { colors } from './styles/tokens.stylex'
import { getRandomFact } from '@/lib/random-fact'

export const metadata = pageMetadata({ title: 'mamuso - manuel muñoz solera', path: '/' })
// The random fact stays stable until the homepage revalidates.
export const revalidate = 180

export default function Home() {
  const notes = getNotePosts(['title', 'date', 'slug']).slice(0, 6)

  return (
    <>
      <HomeContent randomFact={getRandomFact()} />
      <div {...stylex.props(styles.content)}>
        <section aria-labelledby="home-fun" {...stylex.props(styles.module)}>
          <h2 id="home-fun" {...stylex.props(styles.heading, styles.rule)}>Having fun</h2>
          <ul {...stylex.props(layout.list)}>
            {projects.map(project => (
              <li key={project.href} {...stylex.props(styles.rule)}>
                <a href={project.href} {...stylex.props(typography.link, styles.project)}>
                  {project.title}{' '}
                  <span {...stylex.props(typography.muted)}>{project.description}</span>
                </a>
              </li>
            ))}
          </ul>
          <a href="https://github.com/mamuso?tab=repositories" aria-label="More projects" {...stylex.props(typography.mutedLink, styles.more)}>More</a>
        </section>
        <div {...stylex.props(styles.right)}>
          <section aria-labelledby="home-notes" {...stylex.props(styles.module)}>
            <h2 id="home-notes" {...stylex.props(styles.heading, styles.rule)}>Feed</h2>
            <ul {...stylex.props(layout.list)}>
              {notes.map(note => (
                <li key={note.slug} {...stylex.props(styles.rule)}>
                  <PostHome post={note} />
                </li>
              ))}
            </ul>
            <Link href="/notes" aria-label="More notes" {...stylex.props(typography.mutedLink, styles.more)}>More</Link>
          </section>
          <section aria-labelledby="home-photos" {...stylex.props(styles.module)}>
            <h2 id="home-photos" {...stylex.props(styles.heading, styles.rule)}>
              <Link href="/photos" {...stylex.props(typography.link, styles.photoLink)}>Say cheese!</Link>
            </h2>
          </section>
        </div>
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
    columnGap: 16,
    rowGap: 40,
    borderBlockColor: colors.rule,
    borderBlockStyle: 'solid',
    borderBlockWidth: 0.5,
    paddingBlockStart: 28,
    paddingBlockEnd: 36,
  },
  module: {
    minWidth: 0,
  },
  right: {
    display: 'flex',
    flexDirection: 'column',
    gap: 64,
    minWidth: 0,
  },
  rule: {
    borderBlockEndColor: colors.rule,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 0.5,
  },
  heading: {
    fontSize: 18,
    lineHeight: '24px',
    fontWeight: 400,
    margin: 0,
    paddingBlock: 4,
  },
  project: {
    display: 'block',
    lineHeight: '22px',
    paddingBlock: 4,
    overflowWrap: 'anywhere',
  },
  more: {
    display: 'inline-block',
    paddingBlock: 4,
  },
  photoLink: {
    display: 'block',
  },
})
