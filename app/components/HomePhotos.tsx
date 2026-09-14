import Image from 'next/image'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import PhotoStackMotion from './PhotoStackMotion'
import { homePhotoSlots } from './homePhotoComposition'
import { colors } from '../styles/tokens.stylex'

type Photo = { basename: string; width: number; height: number }

export default function HomePhotos({ photos }: { photos: Photo[] }) {
  return (
    <Link href="/photos" draggable={false} aria-labelledby="home-photos" {...stylex.props(styles.module)}>
      <h2 id="home-photos" {...stylex.props(styles.heading)}>Say cheese!</h2>
      <span {...stylex.props(styles.gallery)}>
        {photos.map((photo, index) => {
          const slot = homePhotoSlots[index]
          if (!slot) return null
          const position = `calc(${slot.x * 100}% - ${slot.x * (slot.width + 8)}px)`
          // Gallery is 75% of the card; one third of its width is the card's left inset.
          const left = slot.y < 72 ? `max(${position}, calc(136px - 33.333%))` : position
          return (
            <PhotoStackMotion key={photo.basename} freeDrag maxRotation={2} dragRotation={0.025} data-photo-stack aria-hidden="true"
              {...stylex.props(styles.slot(left, slot.y, slot.layer))}>
              <span data-photo-print {...stylex.props(styles.print(slot.angle))}>
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
    left: '25%',
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
