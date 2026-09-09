import { getPhotoGroups } from '@/lib/photo-gallery'
import { photoGalleryWindow } from '@/lib/photo-gallery-window'
import { pageMetadata } from '@/lib/metadata'
import { BLOG_TITLE } from '@/lib/constants'
import { notFound } from 'next/navigation'
import GalleryInfiniteScroll from '@/app/components/GalleryInfiniteScroll'
import PhotoStack from '@/app/components/PhotoStack'
import GalleryNavigation from '@/app/components/GalleryNavigation'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '@/app/styles/site'

type Props = { searchParams: Promise<{ page?: string | string[] }> }

async function galleryPage(searchParams: Props['searchParams']) {
  const { page } = await searchParams
  const groups = getPhotoGroups()
  const window = photoGalleryWindow(page, groups.length)
  if (!window) notFound()
  return { groups, ...window }
}

export async function generateMetadata({ searchParams }: Props) {
  const { page } = await galleryPage(searchParams)
  return pageMetadata({
    title: `Photos – ${BLOG_TITLE}`,
    path: page === 1 ? '/photos' : `/photos?page=${page}`,
    description: 'Mamuso has a camera',
  })
}

export default async function Photos({ searchParams }: Props) {
  const { groups, page, totalPages, visibleCount } = await galleryPage(searchParams)
  const visible = groups.slice(0, visibleCount)
  return (
    <section {...stylex.props(layout.section, layout.stack, styles.section)}>
      <h2 {...stylex.props(typography.heading, typography.muted, styles.title)}>Say Cheese</h2>
      <GalleryNavigation page={page} {...stylex.props(layout.list, styles.gallery)}>
        {visible.map(({ key, photos }, index) => (
          <li key={key} data-gallery-card>
            <PhotoStack eager={index < 4} photos={photos} collectionHref={photos[0].photoStack ? `/photos/stack/${encodeURIComponent(photos[0].photoStack)}` : undefined} href={`/note/${photos[0].slug}`} title={photos[0].photoStackTitle ?? photos[0].title} />
          </li>
        ))}
      </GalleryNavigation>
      <GalleryInfiniteScroll page={page} hasMore={page < totalPages} visibleCount={visible.length} totalCount={groups.length} />
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
