import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '@/lib/constants'
import { getAllPosts } from '@/lib/api'
import { PostType } from '@/lib/types'
import PostHome from '@/app/components/PostHome'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '@/app/styles/site'

export const metadata = {
  title: `Notes – ${BLOG_TITLE}`,
  description: BLOG_SUBTITLE,
  canonical: `${BLOG_URL}`,
  openGraph: {
    url: `${BLOG_URL}`,
    title: `Notes – ${BLOG_TITLE}`,
    description: `${BLOG_SUBTITLE}`,
    images: [
      {
        url: `${BLOG_URL}/og?title=Notes\&description=${BLOG_TITLE}`,
        width: 1200,
        height: 600,
        alt: `Notes – ${BLOG_TITLE}`,
      },
    ],
    site_name: `${BLOG_TITLE}`,
  },
  twitter: {
    handle: '@mamuso',
    site: '@mamuso',
    cardType: 'summary_large_image',
  },
  icons: {
    icon: {
      url: '/images/favicon.png',
      type: 'image/png',
    },
    shortcut: { url: '/images/favicon.png', type: 'image/png' },
  },
}

const allPosts: PostType[] = getAllPosts(['title', 'date', 'slug', 'category'])

export default function Posts() {
  const postsByYear: { [key: number]: PostType[] } = allPosts.reduce((acc: { [key: number]: PostType[] }, post) => {
    const year = new Date(post.date).getFullYear()
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(post)
    return acc
  }, {} as { [key: number]: PostType[] })

  return (
    <section {...stylex.props(layout.section, styles.section)}>
      <header {...stylex.props(styles.header)}>
        <h2 {...stylex.props(typography.heading)}>Journal</h2>
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
  },
  copy: {
    marginBlock: 0,
  },
  yearGroup: {
    gap: 12,
  },
})
