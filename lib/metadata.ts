import type { Metadata } from 'next'
import { BLOG_SUBTITLE, BLOG_TITLE, BLOG_URL } from './constants'

type PageMetadataOptions = {
  title: string
  description?: string
  path: string
  ogSlug: string
}

export function createPageMetadata({
  title,
  description = BLOG_SUBTITLE,
  path,
  ogSlug,
}: PageMetadataOptions): Metadata {
  const canonicalUrl = new URL(path, BLOG_URL).toString()
  const imageUrl = new URL(`/og/${ogSlug}/opengraph-image`, BLOG_URL).toString()

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      url: canonicalUrl,
      title,
      description,
      siteName: BLOG_TITLE,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 600,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@mamuso',
      creator: '@mamuso',
      title,
      description,
      images: [imageUrl],
    },
  }
}

