import { randomInt } from 'node:crypto'
import Image from 'next/image'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import PhotoStackMotion from './PhotoStackMotion'
import { colors } from '../styles/tokens.stylex'

type Photo = { basename: string; width: number; height: number }

export default function HomePhotos({ photos }: { photos: Photo[] }) {
  const widths = photos.map(photo => (photo.width >= photo.height ? 140 : 80))
  // Stagger prints along both edges, keeping a clear opening beside the title.
  const columns = [4, 26, 31, 50, 58, 82, 76]
  const edges = [70, 64, 150, 88, 154, 72, 148]
  const layers = [7, 2, 6, 1, 5, 3, 4]

  return (
    <Link href="/photos" draggable={false} aria-labelledby="home-photos" {...stylex.props(styles.module)}>
      <h2 id="home-photos" {...stylex.props(styles.heading)}>Say cheese!</h2>
      <span {...stylex.props(styles.gallery)}>
        {photos.map((photo, index) => {
          const height = widths[index] * photo.height / photo.width + 8
          const angle = (index % 2 === 0 ? 1 : -1) * randomInt(1, 4)
          const top = index === 0 ? edges[0] : (edges[index] ?? 150) - height
          const jitter = randomInt(-2, 3)
          return (
            <PhotoStackMotion key={photo.basename} freeDrag maxRotation={2} dragRotation={0.025} data-photo-stack aria-hidden="true"
              {...stylex.props(styles.slot((columns[index] ?? 80) + randomInt(-2, 3), top + jitter, layers[index] ?? 1))}>
              <span data-photo-print {...stylex.props(styles.print(angle))}>
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
    left: '33.333%',
    right: 0,
    pointerEvents: 'none',
  },
  slot: (left: number, top: number, layer: number) => ({
    position: 'absolute',
    top,
    left: `${left}%`,
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
  image: (width: number) => ({
    display: 'block',
    width,
    height: 'auto',
    backgroundColor: colors.placeholder,
  }),
})
