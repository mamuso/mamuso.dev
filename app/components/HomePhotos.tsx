import Image from 'next/image'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import PhotoStackMotion from './PhotoStackMotion'
import type { HomePhotoPlacement } from './homePhotoComposition'
import { colors } from '../styles/tokens.stylex'

export default function HomePhotos({ photos }: { photos: HomePhotoPlacement[] }) {
  return (
    <Link href="/photos" draggable={false} aria-labelledby="home-photos" {...stylex.props(styles.module)}>
      <h2 id="home-photos" {...stylex.props(styles.heading)}>Say cheese!</h2>
      <span {...stylex.props(styles.gallery)}>
        {photos.map(({ photo, left, width, top, height, layer, objectPosition, background }) => {
          return (
            <PhotoStackMotion data-photo-background={background || undefined} key={photo.basename} freeDrag maxRotation={0} dragRotation={0} data-photo-stack aria-hidden="true"
              {...stylex.props(styles.slot(left, width, top, layer))}>
              <span data-photo-print {...stylex.props(styles.print)}>
                <Image src={`/assets/feed/gallery-${photo.basename}`} width={photo.width} height={photo.height}
                  alt="" draggable={false} sizes="(max-width: 879px) 30vw, 150px"
                  {...stylex.props(styles.image(height, objectPosition))} />
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
  slot: (left: number, width: number, top: number, layer: number) => ({
    position: 'absolute',
    top,
    left: `${left}%`,
    width: `${width}%`,
    touchAction: 'none',
    pointerEvents: 'none',
    userSelect: 'none',
    zIndex: layer,
  }),
  print: {
    display: 'block',
    pointerEvents: 'auto',
  },
  image: (height: number, objectPosition: string) => ({
    display: 'block',
    width: '100%',
    height,
    objectFit: 'cover',
    objectPosition,
    backgroundColor: colors.placeholder,
  }),
})
