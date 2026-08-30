import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '@/lib/constants'
import { getPhotoPosts } from '@/lib/api'
import { PostType } from '@/lib/types'
import Link from 'next/link'
import Image from 'next/image'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '@/app/styles/site'

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
    <section {...stylex.props(layout.section, layout.stack)}>
      <h2 {...stylex.props(typography.heading)}>Say Cheese</h2>
      <ul {...stylex.props(layout.list, styles.gallery)}>
        {photoPosts.map((post) => (
          <li key={post.slug}>
            <Link href={`/note/${post.slug}`} {...stylex.props(styles.photoLink)}>
              <Image src={`/assets/feed/gallery-${post.basename}`} width={post.width / 4} height={post.height / 4} alt={post.title} {...stylex.props(styles.photo)} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

const styles = stylex.create({
  gallery: {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: {
      default: '1fr',
      '@media (min-width: 480px)': 'repeat(2, minmax(0, 1fr))',
    },
  },
  photoLink: {
    display: 'block',
  },
  photo: {
    display: 'block',
    height: 'auto',
    width: '100%',
  },
})
