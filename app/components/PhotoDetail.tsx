import type { ReactNode } from 'react'
import type { PhotoPost, PhotoMetadata } from '@/lib/types'
import PhotoMeta from './PhotoMeta'
import ProgressivePhoto from './ProgressivePhoto'
import PhotoTransition from './PhotoTransition'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '@/app/styles/site'

type Props = {
  title: string
  photos: (Pick<PhotoPost, 'slug' | 'title' | 'date' | 'basename' | 'width' | 'height'> & PhotoMetadata)[]
  summary?: ReactNode
  linkPhotos?: boolean
  children?: ReactNode
}

export default function PhotoDetail({ title, photos, summary, linkPhotos = false, children }: Props) {
  return (
    <section {...stylex.props(layout.section, layout.stack)}>
      <Link href="/photos" {...stylex.props(typography.mutedLink)}>← All photos</Link>
      <header {...stylex.props(styles.header)}>
        <h2 {...stylex.props(typography.heading)}>{title}</h2>
        <span {...stylex.props(typography.muted)}>{summary ?? `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`}</span>
      </header>
      <ul {...stylex.props(layout.list, styles.grid, photos.length === 1 && styles.single)}>
        {photos.map((photo, index) => {
          const image = (
            <span {...stylex.props(styles.frame)}>
              <PhotoTransition slug={photo.slug}>
                <ProgressivePhoto basename={photo.basename} width={photo.width} height={photo.height}
                  title={photo.title} sizes={photos.length === 1
                    ? "(max-width: 639px) calc(100vw - 72px), (max-width: 1079px) calc(100vw - 144px), 936px"
                    : "(max-width: 639px) calc(100vw - 72px), (max-width: 1079px) calc((100vw - 200px) / 2), 440px"}
                  eager={index < 2} {...stylex.props(styles.image(photo.width / photo.height))} />
              </PhotoTransition>
            </span>
          )
          return (
            <li key={photo.slug} {...stylex.props(styles.item)}>
              {linkPhotos ? (
                <Link href={`/note/${photo.slug}`} {...stylex.props(styles.photo, typography.link)}>
                  {image}
                </Link>
              ) : (
                <figure {...stylex.props(styles.photo, styles.figure)}>
                  {image}
                </figure>
              )}
              <PhotoMeta post={photo} />
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
  header: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBlockStart: 20 },
  grid: { display: 'grid', gridTemplateColumns: { default: '1fr', '@media (min-width: 640px)': 'repeat(2, minmax(0, 1fr))' }, gap: 32, marginBlockStart: 24 },
  photo: { display: 'flex', flexDirection: 'column', gap: 12, outlineOffset: 6 },
  frame: { display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
  image: (ratio: number) => ({ display: 'block', maxWidth: 'calc(100% - 24px)', width: `min(calc(100% - 24px), ${548 * ratio}px)`, aspectRatio: ratio, height: 'auto', boxSizing: 'content-box', borderWidth: 12, borderStyle: 'solid', borderColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }),
  item: { display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 },
})
