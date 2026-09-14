import { randomInt } from 'node:crypto'
import Image from 'next/image'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import PhotoStackMotion from './PhotoStackMotion'
import { homePhotoSlots } from './homePhotoComposition'
import { colors } from '../styles/tokens.stylex'

type Photo = { basename: string; width: number; height: number }

export default function HomePhotos({ photos }: { photos: Photo[] }) {
  const row = homePhotoSlots.slice(0, 5)
  const rowWidth = row.reduce((total, slot) => total + slot.width + 8, 0)
  return (
    <Link href="/photos" draggable={false} aria-labelledby="home-photos" {...stylex.props(styles.module)}>
      <h2 id="home-photos" {...stylex.props(styles.heading)}>Say cheese!</h2>
      <span {...stylex.props(styles.gallery)}>
        {photos.map((photo, index) => {
          const slot = homePhotoSlots[index]
          if (!slot) return null
          const angle = index < 2 ? 0 : (index % 2 === 0 ? 1 : -1) * randomInt(1, 26) / 10
          // Crop the row slightly at both ends; the raised prints stay behind it.
          const precedingWidth = row.slice(0, index).reduce((total, item) => total + item.width + 8, 0)
          const left = index < 5
            ? `calc(${slot.x * 100}% + ${-12 + precedingWidth + slot.x * (28 - rowWidth)}px)`
            : `${slot.x * 100}%`
          return (
            <PhotoStackMotion key={photo.basename} freeDrag maxRotation={2} dragRotation={0.025} data-photo-stack aria-hidden="true"
              {...stylex.props(styles.slot(left, slot.y, slot.layer))}>
              <span data-photo-print {...stylex.props(styles.print(angle))}>
                <Image src={`/assets/feed/gallery-${photo.basename}`} width={photo.width} height={photo.height}
                  alt="" draggable={false} sizes={`${slot.width}px`}
                  {...stylex.props(styles.image(slot.width, slot.height))} />
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
    display: 'block',
    position: 'relative',
    height: 140,
    borderRadius: 24,
    backgroundColor: '#F8F8F8',
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
    padding: 24,
  },
  gallery: {
    display: 'block',
    position: 'absolute',
    insetBlock: 0,
    left: 0,
    right: 0,
    pointerEvents: 'none',
  },
  slot: (left: string, top: number, layer: number) => ({
    position: 'absolute',
    top,
    left,
    touchAction: 'none',
    pointerEvents: 'none',
    userSelect: 'none',
    zIndex: layer,
  }),
  print: (angle: number) => ({
    transform: `rotate(${angle}deg)`,
    display: 'block',
    pointerEvents: 'auto',
    padding: 4,
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.14), 0 4px 10px rgba(0, 0, 0, 0.1)',
  }),
  image: (width: number, height: number) => ({
    display: 'block',
    width,
    height,
    objectFit: 'cover',
    backgroundColor: colors.placeholder,
  }),
})
