import { pageMetadata, photoSocialImage } from '@/lib/metadata'
import ProgressivePhoto from '@/app/components/ProgressivePhoto'
import PhotoTransition from '@/app/components/PhotoTransition'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { getPhotoPosts } from '@/lib/api'
import { getPhotoStack } from '@/lib/get-photo-stack'
import { BLOG_TITLE } from '@/lib/constants'
import { layout, typography } from '@/app/styles/site'

type Props = { params: Promise<{ stack: string }> }

export function generateStaticParams() {
  return [...new Set(getPhotoPosts(['photoStack']).map((photo) => photo.photoStack).filter(Boolean))]
    .map((stack) => ({ stack }))
}

export async function generateMetadata({ params }: Props) {
  const { stack } = await params
  const photos = getPhotoStack(stack)
  const cover = photos[0]
  const title = cover.photoStackTitle ?? cover.title
  return pageMetadata({
    title: `${title} – Photos – ${BLOG_TITLE}`,
    path: `/photos/stack/${encodeURIComponent(stack)}`,
    description: `${title} — ${photos.length} photos by Mamuso.`,
    image: photoSocialImage(cover.basename, title),
  })
}

export default async function PhotoCollection({ params }: Props) {
  const { stack } = await params
  const photos = getPhotoStack(stack)
  return (
    <section {...stylex.props(layout.section, layout.stack)}>
      <Link href="/photos" {...stylex.props(typography.mutedLink)}>← All photos</Link>
      <header {...stylex.props(styles.header)}>
        <h2 {...stylex.props(typography.heading)}>{photos[0].photoStackTitle ?? photos[0].title}</h2>
        <span {...stylex.props(typography.muted)}>{photos.length} photos</span>
      </header>
      <ul {...stylex.props(layout.list, styles.grid)}>
        {photos.map((photo, index) => (
          <li key={photo.slug}>
            <Link href={`/note/${photo.slug}`} {...stylex.props(styles.photo, typography.link)}>
              <span {...stylex.props(styles.frame)}>
                <PhotoTransition slug={photo.slug}>
                  <ProgressivePhoto basename={photo.basename} width={photo.width} height={photo.height}
                    title={photo.title} sizes="(max-width: 639px) calc(100vw - 48px), (max-width: 1079px) calc((100vw - 152px) / 2), 464px"
                    eager={index < 2} {...stylex.props(styles.image(photo.width / photo.height))} />
                </PhotoTransition>
              </span>
              <span {...stylex.props(styles.caption)}>{photo.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

const styles = stylex.create({
  header: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBlockStart: 20 },
  grid: { display: 'grid', gridTemplateColumns: { default: '1fr', '@media (min-width: 640px)': 'repeat(2, minmax(0, 1fr))' }, gap: 32, marginBlockStart: 24 },
  photo: { display: 'flex', flexDirection: 'column', gap: 12, height: '100%', outlineOffset: 6 },
  frame: { display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
  image: (ratio: number) => ({ display: 'block', maxWidth: 'calc(100% - 12px)', width: `min(calc(100% - 12px), ${548 * ratio}px)`, aspectRatio: ratio, height: 'auto', boxSizing: 'content-box', borderWidth: 6, borderStyle: 'solid', borderColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }),
  caption: { fontSize: 13, textAlign: 'center' },
})
