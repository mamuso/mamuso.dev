import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '@/lib/constants'
import { getPhotoPosts } from '@/lib/api'
import { PostType } from '@/lib/types'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: `Photos – ${BLOG_TITLE}`,
  description: BLOG_SUBTITLE,
  canonical: `${BLOG_URL}`,
  openGraph: {
    url: `${BLOG_URL}`,
    title: `Photos – ${BLOG_TITLE}`,
    description: `Mamuso has a camera`,
    images: [
      {
        url: `${BLOG_URL}/og/Photos/${BLOG_TITLE}/opengraph-image`,
        width: 1200,
        height: 600,
        alt: `Photos – ${BLOG_TITLE}`,
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

export default function Photos() {
  const photoPosts: PostType[] = getPhotoPosts(['title', 'date', 'slug', 'category', 'basename', 'width', 'height'])
  return (
    <section>
      <h2>Say Cheese</h2>
      <ul>
        {photoPosts.map((post) => (
          <li key={post.slug}>
            <Link href={`/note/${post.slug}`}>
              <Image src={`/assets/feed/gallery-${post.basename}`} width={post.width / 4} height={post.height / 4} alt={post.title} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
