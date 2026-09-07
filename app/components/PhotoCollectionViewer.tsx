import PhotoViewerImage from './PhotoViewerImage'
import { notFound } from 'next/navigation'
import * as stylex from '@stylexjs/stylex'
import { getPhotoPosts } from '@/lib/api'
import { comparePhotoStackOrder } from '@/lib/photo-stacks'
import PhotoQuickLook from '@/app/components/PhotoQuickLook'

export default async function CollectionViewer({ params }: { params: Promise<{ stack: string }> }) {
  const { stack } = await params
  const photos = getPhotoPosts(['title', 'slug', 'basename', 'width', 'height', 'photoStack', 'photoStackTitle', 'photoStackOrder'])
    .filter((photo) => photo.photoStack === stack)
    .sort(comparePhotoStackOrder)
  if (!photos.length) notFound()

  return (
    <PhotoQuickLook collection title={photos[0].photoStackTitle ?? photos[0].title} href={`/photos/stack/${stack}`}>
      <ul {...stylex.props(styles.grid)}>
        {photos.map((photo, index) => (
          <li key={photo.slug} {...stylex.props(styles.item)}>
            <figure {...stylex.props(styles.figure)}>
              <div {...stylex.props(styles.image(photo.width / photo.height))}>
                <PhotoViewerImage collection eager={index < 2} basename={photo.basename} width={photo.width} height={photo.height} title={photo.title} />
              </div>
              <figcaption {...stylex.props(styles.caption)}>{photo.title}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </PhotoQuickLook>
  )
}

const styles = stylex.create({
  grid: { display: 'grid', gridTemplateColumns: { default: '1fr', '@media (min-width: 640px)': 'repeat(2, minmax(0, 1fr))' }, gap: 48, listStyle: 'none', padding: 0, margin: 0 },
  item: { display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 },
  figure: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, margin: 0, width: '100%' },
  image: (ratio: number) => ({ display: 'block', width: `min(100%, calc(70dvh * ${ratio}))`, maxWidth: '100%', boxSizing: 'border-box', borderWidth: 8, borderStyle: 'solid', borderColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 12px 32px rgba(0,0,0,0.12)' }),
  caption: { fontSize: 14, textAlign: 'center' },
})
