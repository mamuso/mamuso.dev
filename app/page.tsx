import type { PostSummary } from '@/lib/types'
import BlankNoteYear from '@/app/components/BlankNoteYear'
import { groupNoteYears } from '@/lib/note-years'
import { homeLink } from '@/app/styles/homeLink.stylex'
import { pageMetadata } from '@/lib/metadata'
import Link from 'next/link'
import { getNotePosts, getPhotoPosts } from '@/lib/api'
import { randomInt } from 'node:crypto'
import PostHome from '@/app/components/PostHome'
import HomeContent from '@/app/components/HomeContent'
import HomePhotos from '@/app/components/HomePhotos'
import MoreLink from '@/app/components/MoreLink'
import { homeLinks } from '@/app/styles/homeLinks'
import { listHover } from '@/app/styles/listHover'
import { projects } from '@/data/projects'
import * as stylex from '@stylexjs/stylex'
import { layout } from '@/app/styles/site'
import { colors } from './styles/tokens.stylex'
import { getRandomFact } from '@/lib/random-fact'

export const metadata = pageMetadata({ title: 'mamuso - manuel muñoz solera', path: '/' })
// The random fact stays stable until the homepage revalidates.
export const revalidate = 180

export default function Home() {
  const photoPool = getPhotoPosts(['basename', 'width', 'height'])
  const photos = Array.from({ length: Math.min(6, photoPool.length) }, () =>
    photoPool.splice(randomInt(photoPool.length), 1)[0])
  const feed = groupNoteYears(getNotePosts(['title', 'date', 'slug']))
    .flatMap<{ year: number, post: PostSummary | null }>(({ year, notes }) => notes.length
      ? notes.map(post => ({ year, post }))
      : [{ year, post: null }])
    .slice(0, 6)

  return (
    <>
      <HomeContent randomFact={getRandomFact()} />
      <div {...stylex.props(styles.content)}>
        <section aria-labelledby="home-fun" {...stylex.props(styles.module, styles.projects)}>
          <div>
            <h2 id="home-fun" {...stylex.props(styles.heading, styles.rule)}>Having fun</h2>
            <ul {...stylex.props(layout.list)}>
              {projects.map(project => (
                <li key={project.href} {...stylex.props(styles.rule)}>
                  <a href={project.href} title={`${project.title} — ${project.description}`} {...stylex.props(homeLink, homeLinks.primary, styles.project, listHover.row)}>
                    <span aria-hidden="true" {...stylex.props(listHover.square)} />
                    {project.title}{' '}
                    <span {...stylex.props(homeLinks.secondary)}>{project.description}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div><MoreLink href="https://github.com/mamuso?tab=repositories" label="More projects" /></div>
        </section>
        <div {...stylex.props(styles.right)}>
          <section aria-labelledby="home-notes" {...stylex.props(styles.module)}>
            <h2 id="home-notes" {...stylex.props(styles.heading, styles.rule)}>
              <Link href="/notes" {...stylex.props(homeLinks.primary, styles.photoLink)}>Feed</Link>
            </h2>
            <ul {...stylex.props(layout.list)}>
              {feed.map(({ year, post }) => (
                <li key={post?.slug ?? year} {...stylex.props(styles.rule)}>
                  {post ? <PostHome post={post} /> : <BlankNoteYear year={year} />}
                </li>
              ))}
            </ul>
            <MoreLink href="/notes" label="More notes" />
          </section>
          <section aria-labelledby="home-photos" {...stylex.props(styles.module)}>
            <HomePhotos photos={photos} />
          </section>
        </div>
      </div>
    </>
  )
}

const styles = stylex.create({
  content: {
    color: '#17181B',
    fontSize: 16,
    fontWeight: 400,
    letterSpacing: '-0.005em',
    lineHeight: '22px',
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@media (min-width: 880px)': 'repeat(2, minmax(0, 1fr))',
    },
    columnGap: 16,
    rowGap: { default: 40, '@media (min-width: 880px)': 0 },
    borderBlockColor: colors.rule,
    borderBlockStyle: 'solid',
    borderBlockWidth: 0.5,
    paddingBlockStart: 28,
    paddingBlockEnd: 36,
  },
  module: {
    minWidth: 0,
  },
  projects: {
    display: { default: 'block', '@media (min-width: 880px)': 'grid' },
    gridColumn: { default: 'auto', '@media (min-width: 880px)': '1' },
    gridRow: { default: 'auto', '@media (min-width: 880px)': '1 / span 2' },
    gridTemplateRows: { default: 'none', '@media (min-width: 880px)': 'subgrid' },
  },
  right: {
    display: 'flex',
    flexDirection: 'column',
    gap: { default: 64, '@media (min-width: 880px)': 32 },
    gridColumn: { default: 'auto', '@media (min-width: 880px)': '2' },
    gridRow: { default: 'auto', '@media (min-width: 880px)': '1' },
    justifyContent: 'space-between',
    minWidth: 0,
  },
  rule: {
    borderBlockEndColor: colors.rule,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 0.5,
  },
  heading: {
    fontSize: 18,
    letterSpacing: '-0.005em',
    lineHeight: '24px',
    fontWeight: 400,
    margin: 0,
    paddingBlock: 4,
  },
  project: {
    display: 'block',
    lineHeight: '22px',
    paddingBlock: 5,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  photoLink: {
    display: 'block',
  },
})
