import { editorialYear } from '@/lib/editorial-date'
import { pageMetadata } from '@/lib/metadata'
import { BLOG_TITLE } from '@/lib/constants'
import { getNotePosts } from '@/lib/api'
import { PostSummary } from '@/lib/types'
import PostHome from '@/app/components/PostHome'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '@/app/styles/site'

export const metadata = pageMetadata({ title: `Notes – ${BLOG_TITLE}`, path: '/notes' })

const allPosts: PostSummary[] = getNotePosts(['title', 'date', 'slug', 'category'])

export default function Posts() {
  const postsByYear: { [key: number]: PostSummary[] } = allPosts.reduce((acc: { [key: number]: PostSummary[] }, post) => {
    const year = editorialYear(post.date)
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(post)
    return acc
  }, {} as { [key: number]: PostSummary[] })

  return (
    <section {...stylex.props(layout.section, styles.section)}>
      <header {...stylex.props(styles.header)}>
        <h2 {...stylex.props(typography.display, typography.muted, styles.heading)}>Probably not thinking about you</h2>
        <p {...stylex.props(styles.copy)}>
          <Link href="/notes/1" {...stylex.props(typography.mutedLink)}>Expand all notes ↓</Link>
        </p>
      </header>
      {Object.entries(postsByYear)
        .reverse()
        .map(([year, posts]) => (
          <div key={year} {...stylex.props(layout.stack, styles.yearGroup)}>
            <h3 {...stylex.props(typography.heading, typography.muted)}>{year}</h3>
            <ul {...stylex.props(layout.list, layout.stack)}>
              {posts.map((post) => (
                <li key={post.slug}>
                  <PostHome post={post} />
                </li>
              ))}
            </ul>
          </div>
        ))}
    </section>
  )
}

const styles = stylex.create({
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
  },
  header: {
    alignItems: 'baseline',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  heading: {
    fontWeight: 400,
  },
  copy: {
    marginBlock: 0,
  },
  yearGroup: {
    gap: 32,
  },
})
