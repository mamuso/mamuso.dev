import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '@/lib/constants'
import { NextPage } from 'next'
import { getAllPosts } from '@/lib/api'
import { PostType } from '@/lib/types'
import PostHome from '@/app/components/PostHome'
import Link from 'next/link'

export const metadata = {
  title: `${BLOG_TITLE} – Yet another journal`,
  description: BLOG_SUBTITLE,
  canonical: `${BLOG_URL}`,
  openGraph: {
    url: `${BLOG_URL}`,
    title: `${BLOG_TITLE}`,
    description: `${BLOG_SUBTITLE}`,
    images: [
      {
        url: `${BLOG_URL}/images/og.png`,
        width: 1200,
        height: 627,
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

const postsPerPage: number = 10
const allPosts: PostType[] = getAllPosts(['title', 'date', 'slug', 'image', 'category'])

function fetchData() {
  let pagePosts = allPosts.slice(0, postsPerPage)
  return {
    pagePosts: pagePosts,
  }
}

const Home: NextPage = () => {
  const props = fetchData()
  return (
    <>
      <style>{`#header h1 span { opacity: 0;}`}</style>
      <section className="home-headline">
        <h2>
          <span>Manuel Muñoz Solera</span> — Crayon holder and key stroker. Currently leading a talented team of software designers at GitHub.
        </h2>
      </section>

      <section className="home-posts">
        <h2 className="section-title">Journal</h2>
        <ul>
          {props.pagePosts.map((post, i) => (
            <li>
              <PostHome key={i} post={post} />
            </li>
          ))}
        </ul>
        <p>
          <Link href="/posts/1">View more →</Link>
        </p>
      </section>

      <p>Hello</p>
    </>
  )
}

export default Home
