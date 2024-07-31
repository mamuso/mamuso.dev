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
  const galleryHeight = 200
  const photoPosts: PostType[] = getPhotoPosts(['title', 'date', 'slug', 'category', 'basename', 'width', 'height'])
  return (
    <div className="photo-gallery">
      {photoPosts.map((post, i) => (
        <div key={i} style={{ width: `${(post.width * galleryHeight) / post.height}px`, flexGrow: `${(post.width * galleryHeight) / post.height}` }}>
          <Link href={`/post/${post.slug}`}>
            <i style={{ paddingBottom: `${(post.height / post.width) * 100}%` }} />
            <Image src={`/assets/feed/${post.basename}`} sizes="(min-width: 1040px) 874px, (min-width: 900px) 807px, calc(94.31vw - 23px)" width={post.width / 4} height={post.height / 4} alt={post.title} className="loaded" />
          </Link>
        </div>
      ))}
    </div>
  )
}
