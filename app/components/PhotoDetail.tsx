import type { ReactNode } from 'react'
import type { PhotoPost, PhotoMetadata } from '@/lib/types'
import PhotoMeta from './PhotoMeta'
import BackToPhotos from './BackToPhotos'
import ProgressivePhoto from './ProgressivePhoto'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '@/app/styles/site'

type Props = {
  title: string
  photos: (Pick<PhotoPost, 'slug' | 'title' | 'date' | 'basename' | 'width' | 'height'> & PhotoMetadata)[]
  linkPhotos?: boolean
  children?: ReactNode
}

export default function PhotoDetail({ title, photos, linkPhotos = false, children }: Props) {
  return (
    <section aria-label={title} {...stylex.props(layout.stack)}>
      <BackToPhotos />
      <ul {...stylex.props(layout.list, styles.grid, photos.length === 1 && styles.single)}>
        {photos.map((photo, index) => {
          const ratio = photo.width / photo.height
          const portrait = ratio < 1
          const desktopWidth = portrait ? 580 : 936
          const image = (
            <span {...stylex.props(styles.frame)}>
              <ProgressivePhoto transitionSlug={photo.slug} basename={photo.basename} width={photo.width} height={photo.height}
                title={photo.title} sizes={photos.length === 1
                  ? `(max-width: 639px) calc(100vw - 72px), (max-width: 1079px) calc(100vw - 144px), ${desktopWidth}px`
                  : `(max-width: 639px) calc(100vw - 72px), (max-width: 1079px) calc((100vw - 200px) / 2), ${desktopWidth}px`}
                eager={index < 2} {...stylex.props(styles.image(ratio, desktopWidth), portrait ? styles.portraitImage : styles.landscapeImage)} />
            </span>
          )
          return (
            <li key={photo.slug} {...stylex.props(styles.item, portrait && styles.portrait)}>
              {linkPhotos ? (
                <Link href={`/note/${photo.slug}`} {...stylex.props(styles.photo, typography.link)}>
                  {image}
                </Link>
              ) : (
                <figure {...stylex.props(styles.photo, styles.figure)}>
                  {image}
                </figure>
              )}
              <div {...stylex.props(styles.metadata, portrait ? styles.portraitMetadata : styles.landscapeMetadata)}>
                <PhotoMeta post={photo} orientation={portrait ? 'portrait' : 'landscape'} />
              </div>
            </li>
          )
        })}
      </ul>
      {children}
    </section>
  )
}

const styles = stylex.create({
  single: { gridTemplateColumns: '1fr' },
  figure: { margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: { default: '1fr', '@media (min-width: 640px) and (max-width: 1079px)': 'repeat(2, minmax(0, 1fr))' }, gap: { default: 32, '@media (min-width: 1080px)': 80 }, marginBlockStart: { default: 24, '@media (min-width: 1080px)': 40 } },
  photo: { display: 'flex', flexDirection: 'column', gap: 12, outlineOffset: 6, position: 'relative', zIndex: 2, minWidth: 0 },
  frame: { display: 'flex', alignItems: 'center', justifyContent: { default: 'center', '@media (min-width: 1080px)': 'flex-end' }, flexGrow: 1 },
  image: (ratio: number, desktopWidth: number) => ({ display: 'block', maxWidth: 'calc(100% - 24px)', width: { default: `min(calc(100% - 24px), ${548 * ratio}px)`, '@media (min-width: 1080px)': `min(calc(100% - 24px), ${desktopWidth}px)` }, aspectRatio: ratio, height: 'auto', boxSizing: 'content-box', padding: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }),
  item: { display: { default: 'flex', '@media (min-width: 1080px)': 'grid' }, flexDirection: 'column', gridTemplateColumns: { default: 'none', '@media (min-width: 1080px)': 'minmax(0, 1fr)' }, alignItems: { default: 'stretch', '@media (min-width: 1080px)': 'center' }, gap: 24, minWidth: 0 },
  // The portrait column includes the image's two 12px frame borders.
  portrait: { gridTemplateColumns: { default: 'none', '@media (min-width: 1080px)': '604px minmax(0, 1fr)' }, columnGap: { default: 24, '@media (min-width: 1080px)': 12 } },
  landscapeImage: { boxShadow: { default: '0 2px 8px rgba(0,0,0,0.1)', '@media (min-width: 1080px)': '0 3px 6px rgba(0,0,0,0.12), 0 14px 24px -10px rgba(0,0,0,0.24)' } },
  landscapeMetadata: { marginTop: { default: 0, '@media (min-width: 1080px)': -48 } },
  portraitImage: { boxShadow: { default: '0 2px 8px rgba(0,0,0,0.1)', '@media (min-width: 1080px)': '2px 3px 6px rgba(0,0,0,0.12), 10px 12px 24px -10px rgba(0,0,0,0.24)' } },
  portraitMetadata: { alignSelf: { default: 'auto', '@media (min-width: 1080px)': 'start' }, marginTop: { default: 0, '@media (min-width: 1080px)': 40 }, marginLeft: { default: 0, '@media (min-width: 1080px)': -60 } },
  metadata: { position: 'relative', zIndex: 1, minWidth: 0 },
})
