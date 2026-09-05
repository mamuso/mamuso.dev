import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '@/lib/constants'
import { NextPage } from 'next'
import Link from 'next/link'
import { getRecentPosts } from '@/lib/api'
import PostHome from '@/app/components/PostHome'
import HomeContent from '@/app/components/HomeContent'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '@/app/styles/site'

export const metadata = {
  metadataBase: new URL('https://mamuso.dev'),
  title: 'mamuso - manuel muñoz solera',
  description: BLOG_SUBTITLE,
  canonical: `/`,
  openGraph: {
    url: `${BLOG_URL}`,
    title: `${BLOG_TITLE}`,
    description: `${BLOG_SUBTITLE}`,
    images: [
      {
        url: `${BLOG_URL}/og/${BLOG_TITLE}/${BLOG_SUBTITLE}/opengraph-image`,
        width: 1200,
        height: 600,
        alt: `${BLOG_TITLE} – ${BLOG_SUBTITLE}`,
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

const POSTS_PER_PAGE = 10
const SHOW_JOURNAL = false

const Journal = () => {
  const recentPosts = getRecentPosts(POSTS_PER_PAGE, ['title', 'date', 'slug', 'image', 'category'])

  return (
    <section {...stylex.props(layout.section, layout.stack)}>
      <h2 {...stylex.props(typography.heading)}>Journal</h2>
      <ul {...stylex.props(layout.list, layout.stack)}>
        {recentPosts.map((post) => (
          <li key={post.slug}>
            <PostHome post={post} />
          </li>
        ))}
      </ul>
      <p {...stylex.props(styles.copy)}>
        <Link href="/notes" {...stylex.props(typography.mutedLink)}>View more →</Link>
      </p>
    </section>
  )
}

const Home: NextPage = () => {
  return (
    <>
      <HomeContent />
      <section {...stylex.props(layout.fullBleed, styles.content)}>
        <div {...stylex.props(layout.container)}>
          <p {...stylex.props(styles.copy)}>
            <Link href="/photos" {...stylex.props(typography.link)}>temp link to photos</Link>
          </p>
        </div>
      </section>
      {SHOW_JOURNAL ? <Journal /> : null}
    </>
  )
}

export default Home

const styles = stylex.create({
  content: {
    paddingBlock: 64,
  },
  copy: {
    marginBlock: 0,
  },
})
