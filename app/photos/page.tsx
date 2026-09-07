import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '@/lib/constants'
import { getPhotoPosts } from '@/lib/api'
import { PostType } from '@/lib/types'
import { comparePhotoStackOrder } from '@/lib/photo-stacks'
import PhotoStack from '@/app/components/PhotoStack'
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
  const photoPosts: PostType[] = getPhotoPosts(['title', 'date', 'slug', 'category', 'basename', 'width', 'height', 'photoStack', 'photoStackTitle', 'photoStackOrder'])
  const groups = new Map<string, PostType[]>()
  for (const post of photoPosts) {
    const key = post.photoStack ? `stack:${post.photoStack}` : `photo:${post.slug}`
    const group = groups.get(key)
    if (group) group.push(post)
    else groups.set(key, [post])
  }
  for (const photos of groups.values()) photos.sort(comparePhotoStackOrder)
  return (
    <section {...stylex.props(layout.section, layout.stack, styles.section)}>
      <h2 {...stylex.props(typography.heading, typography.muted, styles.title)}>Say Cheese</h2>
      <ul {...stylex.props(layout.list, styles.gallery)}>
        {Array.from(groups, ([key, photos]) => (
          <li key={key}>
            <PhotoStack photos={photos} collectionHref={photos[0].photoStack ? `/photos/stack/${encodeURIComponent(photos[0].photoStack)}` : undefined} href={`/note/${photos[0].slug}`} title={photos[0].photoStackTitle ?? photos[0].title} />
          </li>
        ))}
      </ul>
    </section>
  )
}

const styles = stylex.create({
  section: {
    marginBlockStart: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 400,
    letterSpacing: '-0.015em',
    lineHeight: 1.2,
  },
  gallery: {
    display: 'grid',
    columnGap: { default: 16, '@media (min-width: 480px)': 32 },
    rowGap: { default: 24, '@media (min-width: 480px)': 40 },
    marginBlockStart: 52,
    paddingBlockEnd: 32,
    gridTemplateColumns: {
      default: 'repeat(2, minmax(0, 1fr))',
      '@media (min-width: 640px)': 'repeat(3, minmax(0, 1fr))',
      '@media (min-width: 960px)': 'repeat(4, minmax(0, 1fr))',
    },
  },
})
