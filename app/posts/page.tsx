import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '@/lib/constants'
import { getAllPosts } from '@/lib/api'
import { PostType } from '@/lib/types'
import PostHome from '@/app/components/PostHome'
import Link from 'next/link'

export const metadata = {
  title: `Posts – ${BLOG_TITLE}`,
  description: BLOG_SUBTITLE,
  canonical: `${BLOG_URL}`,
  openGraph: {
    url: `${BLOG_URL}`,
    title: `Posts – ${BLOG_TITLE}`,
    description: `${BLOG_SUBTITLE}`,
    images: [
      {
        url: `${BLOG_URL}/og?title=Posts\&description=${BLOG_TITLE}`,
        width: 1200,
        height: 600,
        alt: `Posts – ${BLOG_TITLE}`,
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

const allPosts: PostType[] = getAllPosts(['title', 'date', 'slug', 'content', 'summary', 'category', 'basename', 'camera', 'iso', 'fnumber', 'exposureBiasValue', 'exposureTime', 'GPSLatitude', 'GPSLongitude', 'width', 'height', 'colorPalette'])

export default function Posts() {
  // Group posts by year
  const postsByYear: { [key: number]: PostType[] } = allPosts.reduce((acc: { [key: number]: PostType[] }, post) => {
    const year = new Date(post.date).getFullYear()
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(post)
    return acc
  }, {} as { [key: number]: PostType[] })

  return (
    <section className="home-posts">
      <header className="home-post-header">
        <h2 className="section-title">Journal</h2>
        <p>
          <Link href="/posts/1">Expand all entries ↓</Link>
        </p>
      </header>
      {Object.entries(postsByYear)
        .reverse()
        .map(([year, posts]) => (
          <div key={year}>
            <h3 className="section-title">{year}</h3>
            <ul>
              {posts.map((post, i) => (
                <li key={i}>
                  <PostHome post={post} />
                </li>
              ))}
            </ul>
          </div>
        ))}
    </section>
  )
}
