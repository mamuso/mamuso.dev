import type { Metadata } from 'next'
import { BLOG_SUBTITLE, BLOG_TITLE } from './constants'

type SocialImage = { url: string; alt: string; width?: number; height?: number }

export function photoSocialImage(basename: string, title: string): SocialImage {
  // Feed assets are public JPEGs; omit dimensions rather than using original-image dimensions.
  return { url: `/assets/feed/${encodeURIComponent(basename)}`, alt: title }
}

export function pageMetadata({ title, path, description = BLOG_SUBTITLE, image }: {
  title: string
  path: string
  description?: string
  image?: SocialImage
}) {
  const socialImage = image ?? {
    url: `/og?${new URLSearchParams({ title, description })}`,
    width: 1200,
    height: 600,
    alt: `${title} – ${description}`,
  }
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', url: path, title, description, siteName: BLOG_TITLE, images: [socialImage] },
    twitter: { card: 'summary_large_image', site: '@mamuso', creator: '@mamuso', title, description, images: [socialImage] },
  } satisfies Metadata
}
