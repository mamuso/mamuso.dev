import { getPhotoGroups } from '@/lib/photo-gallery'
import { photoGalleryWindow } from '@/lib/photo-gallery-window'
import { pageMetadata } from '@/lib/metadata'
import { BLOG_TITLE } from '@/lib/constants'
import { notFound } from 'next/navigation'
import PhotoGallery from '@/app/components/PhotoGallery'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '@/app/styles/site'

type Props = { searchParams: Promise<{ page?: string | string[] }> }

async function galleryPage(searchParams: Props['searchParams']) {
  const { page } = await searchParams
  const groups = await getPhotoGroups()
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

// Resolve the cumulative query before revealing the gallery so photo morphs and
// scroll restoration measure the complete destination, never a loading fallback.
export const instant = false

export default async function Photos({ searchParams }: Props) {
  const { groups, page, totalPages, visibleCount } = await galleryPage(searchParams)
  const visible = groups.slice(0, visibleCount)
  return (
    <section {...stylex.props(layout.section, layout.stack, styles.section)}>
      <h2 {...stylex.props(typography.heading, typography.muted, typography.display, styles.title)}>Say Cheese</h2>
      {groups.length === 0 && <p {...stylex.props(typography.muted, styles.empty)}>No photos yet.</p>}
      <PhotoGallery key={page} initialGroups={visible} initialPage={page} totalPages={totalPages} totalCount={groups.length} />
    </section>
  )
}

const styles = stylex.create({
  section: {
    marginBlockStart: 24,
  },
  title: {
    fontWeight: 400,
  },
  empty: {
    marginBlock: 0,
  },
})
