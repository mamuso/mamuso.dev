import type { Metadata } from 'next'
import { BLOG_SUBTITLE, BLOG_TITLE } from './constants'

type SocialImage = { url: string; alt: string; width?: number; height?: number }

const generated = (url: string, alt: string): SocialImage => ({ url, width: 1200, height: 630, alt })

// Generated images mirror page paths: /note/<slug> → /og/note/<slug>, and so on.

/** A written note on the notes cartridge. */
export function noteSocialImage(slug: string, title: string) {
  return generated(`/og/note/${encodeURIComponent(slug)}`, title)
}

/** A single photo on the photo cartridge. */
export function photoSocialImage(slug: string, title: string) {
  return generated(`/og/photo/${encodeURIComponent(slug)}`, title)
}

/** A photo stack: its cover with the next photo askew behind it. */
export function stackSocialImage(stack: string, title: string) {
  return generated(`/og/stack/${encodeURIComponent(stack)}`, title)
}

export function pageMetadata({ title, path, description = BLOG_SUBTITLE, socialTitle = title, image }: {
  title: string
  path: string
  description?: string
  /** The title printed on the generated page image, without the site suffix. */
  socialTitle?: string
  image?: SocialImage
}) {
  const socialImage = image ?? generated(`/og/page/${encodeURIComponent(socialTitle)}`, socialTitle)
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', url: path, title, description, siteName: BLOG_TITLE, images: [socialImage] },
    twitter: { card: 'summary_large_image', site: '@mamuso', creator: '@mamuso', title, description, images: [socialImage] },
  } satisfies Metadata
}
