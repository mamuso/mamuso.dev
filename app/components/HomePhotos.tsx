import Image from 'next/image'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import PhotoStackMotion from './PhotoStackMotion'
import { colors } from '../styles/tokens.stylex'

type Photo = { basename: string; width: number; height: number }

export default function HomePhotos({ photos }: { photos: Photo[] }) {
  const widths = photos.map(photo => (photo.width >= photo.height ? 140 : 80))
  const lastPrintWidth = (widths.at(-1) ?? 0) + 8

  return (
    <Link href="/photos" draggable={false} aria-labelledby="home-photos" {...stylex.props(styles.module)}>
      <h2 id="home-photos" {...stylex.props(styles.heading)}>Say cheese!</h2>
      <span {...stylex.props(styles.gallery)}>
        {photos.map((photo, index) => {
          const progress = photos.length > 1 ? index / (photos.length - 1) : 0
          // Distribute the starts evenly, with the final print extending 16px past the edge.
          const offset = -progress * (lastPrintWidth - 16)
          return (
            <PhotoStackMotion key={photo.basename} data-photo-stack aria-hidden="true"
              {...stylex.props(styles.slot(progress, offset, photos.length - index))}>
              <span data-photo-print {...stylex.props(styles.print)}>
                <Image src={`/assets/feed/gallery-${photo.basename}`} width={photo.width} height={photo.height}
                  alt="" draggable={false} sizes={`${widths[index]}px`}
                  {...stylex.props(styles.image(widths[index]))} />
              </span>
            </PhotoStackMotion>
          )
        })}
      </span>
    </Link>
  )
}

const styles = stylex.create({
  module: {
    display: 'grid',
    gridTemplateColumns: 'max-content minmax(0, 1fr)',
    columnGap: 20,
    paddingInlineStart: 32,
    height: 90,
    borderRadius: 24,
    backgroundColor: '#FBFBFB',
    overflow: 'hidden',
    color: colors.textPrimary,
    textDecoration: 'none',
    outlineOffset: 4,
  },
  heading: {
    fontSize: 18,
    lineHeight: '24px',
    textAlign: 'left',
    fontWeight: 400,
    margin: 0,
    alignSelf: 'center',
    transform: 'translateY(-1px)',
  },
  gallery: {
    display: 'block',
    position: 'relative',
    marginBlockStart: 20,
    minWidth: 0,
  },
  slot: (progress: number, offset: number, layer: number) => ({
    position: 'absolute',
    top: 0,
    left: `calc(${progress * 100}% + ${offset}px)`,
    touchAction: 'pan-y pinch-zoom',
    userSelect: 'none',
    zIndex: layer,
  }),
  print: {
    display: 'block',
    padding: 4,
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.14), 0 4px 10px rgba(0, 0, 0, 0.1)',
  },
  image: (width: number) => ({
    display: 'block',
    width,
    height: 'auto',
    backgroundColor: colors.placeholder,
  }),
})
