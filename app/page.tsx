import { pageMetadata } from '@/lib/metadata'
import { NextPage } from 'next'
import Link from 'next/link'
import { getRecentPosts } from '@/lib/api'
import PostHome from '@/app/components/PostHome'
import HomeContent from '@/app/components/HomeContent'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '@/app/styles/site'
import { getRandomFact } from '@/lib/random-fact'

export const metadata = pageMetadata({ title: 'mamuso - manuel muñoz solera', path: '/' })
export const revalidate = 180

const POSTS_PER_PAGE = 10
const SHOW_JOURNAL = false

const Journal = () => {
  const recentPosts = getRecentPosts(POSTS_PER_PAGE, ['title', 'date', 'slug', 'category'])

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
      <HomeContent randomFact={getRandomFact()} />
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
    flex: {
      default: '1',
      '@media (min-width: 880px)': '0 1 auto',
    },
    paddingBlock: 64,
  },
  copy: {
    marginBlock: 0,
  },
})
