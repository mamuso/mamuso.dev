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
            <li key={i}>
              <PostHome post={post} />
            </li>
          ))}
        </ul>
        <p>
          <Link href="/posts/1">View more →</Link>
        </p>
      </section>

      <section className="home-projects">
        <h2 className="section-title">Side, Fun Projects</h2>
        <ul>
          <li>eeee</li>
          <li>eeee</li>
          <li>eeee</li>
          <li>eeee</li>
          <li>eeee</li>
          <li>eeee</li>
          <li>eeee</li>
          <li>eeee</li>
          <li>eeee</li>
          <li>eeee</li>
          <li>eeee</li>
          <li>
            <a>View more ↓</a>
          </li>
        </ul>
        <h2 className="section-title">Work</h2>
        <ul>
          <li>
            <Link href="https://github.com">
              <i>L</i>
              <span>
                <strong>GitHub</strong>
                <span>
                  <em>Director of Design</em>
                  <time>2019 – Now</time>
                </span>
              </span>
            </Link>
          </li>
          <li>
            <Link href="https://azure.microsoft.com/en-us/products/devops">
              <i>L</i>
              <span>
                <strong>Microsoft, Developer Services</strong>
                <span>
                  <em>Director of Design</em>
                  <time>2018 – 2019</time>
                </span>
              </span>
            </Link>
          </li>
        </ul>
      </section>
    </>
  )
}

export default Home
