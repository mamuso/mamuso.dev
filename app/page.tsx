import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '@/lib/constants'
import { NextPage } from 'next'
import Link from 'next/link'
import { getRecentPosts } from '@/lib/api'
import PostHome from '@/app/components/PostHome'
import CartridgeStage from '@/app/components/CartridgeStageDynamic'

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
const recentPosts = getRecentPosts(POSTS_PER_PAGE, ['title', 'date', 'slug', 'image', 'category'])

const Home: NextPage = () => {
  return (
    <>
      <CartridgeStage />
      <section>
        <h2>Manuel Muñoz Solera</h2>
        <p>Crayon holder and key stroker.</p>
      </section>

      <section>
        <h2>Journal</h2>
        <ul>
          {recentPosts.map((post) => (
            <li key={post.slug}>
              <PostHome post={post} />
            </li>
          ))}
        </ul>
        <p>
          <Link href="/notes">View more →</Link>
        </p>
      </section>

    </>
  )
}

export default Home
