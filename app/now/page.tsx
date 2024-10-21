import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '@/lib/constants'
import { PostType } from '@/lib/types'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: `What I'm doing now – ${BLOG_TITLE}`,
  description: BLOG_SUBTITLE,
  canonical: `${BLOG_URL}`,
  openGraph: {
    url: `${BLOG_URL}`,
    title: `Now – ${BLOG_TITLE}`,
    description: `What I'm doing now`,
    images: [
      {
        url: `${BLOG_URL}/og/Photos/${BLOG_TITLE}/opengraph-image`,
        width: 1200,
        height: 600,
        alt: `Now – ${BLOG_TITLE}`,
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

export default function Now() {
  return (
    <article className="post">
      <h2>What I'm doing now</h2>
      <section className="post-meta mono">
        <time> Updated October 21st, 2024</time>
      </section>
      <section className="post-content">
        <p>
          This is a <a href="https://nownownow.com/about">now</a> page, and this is what I'm focused on right now.
        </p>
      </section>
    </article>
  )
}
