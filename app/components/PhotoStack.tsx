import Image from 'next/image'
import PhotoTransition from './PhotoTransition'
import PhotoStackMotion from './PhotoStackMotion'
import { photoMotion } from './photoInteraction'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { colors } from '../styles/tokens.stylex'

export interface PhotoPrint {
  slug?: string
  basename: string
  width: number
  height: number
  title: string
}

// Independent, deterministic samples keep each print's position stable across renders.
function sample(seed: number, index: number, axis: number) {
  let value = seed ^ Math.imul(index + 1, 0x9e3779b9) ^ Math.imul(axis + 1, 0x85ebca6b)
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad)
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97)
  return ((value ^ (value >>> 15)) >>> 0) / 4294967296
}

/** Up to six prints suggest the collection; its title and count open every photo. */
export default function PhotoStack({ photos, href, title, collectionHref, eager = false }: { photos: PhotoPrint[]; href: string; title: string; collectionHref?: string; eager?: boolean }) {
  if (!photos.length) return null
  const visible = collectionHref ? photos.slice(0, 6) : photos
  // Seed the arrangement from the collection URL.
  const hash = Array.from(href).reduce((value, character) => (Math.imul(value, 31) + character.charCodeAt(0)) | 0, 0)
  return (
    <div data-photo-link data-photo-group={photos.length > 1 ? true : undefined} {...stylex.props(styles.link)}>
      <PhotoStackMotion data-photo-stack {...stylex.props(styles.stack)}>
        {visible.map((photo, index) => (
          <Link href={collectionHref ?? (photo.slug ? `/note/${photo.slug}` : href)} aria-label={photo.title} data-photo-print key={`${photo.basename}-${index}`} {...stylex.props(styles.print, styles.pose(index, visible.length, (sample(hash, index, 0) - 0.5) * photoMotion.initial.x, (sample(hash, index, 1) - 0.5) * photoMotion.initial.y + photoMotion.initial.yOffset, (sample(hash, index, 2) - 0.5) * photoMotion.initial.angle))}>
            <PhotoTransition slug={photo.slug}>
              <Image
                src={`/assets/feed/gallery-${photo.basename}`}
                width={photo.width}
                height={photo.height}
                loading={eager ? 'eager' : 'lazy'}
                alt=""
                sizes="(max-width: 479px) 120px, 160px"
                {...stylex.props(styles.image(photo.width / Math.max(photo.width, photo.height), photo.height / Math.max(photo.width, photo.height)))}
              />
            </PhotoTransition>
          </Link>
        ))}
      </PhotoStackMotion>
      <Link href={collectionHref ?? href} {...stylex.props(styles.title)}>{title}</Link>
      {photos.length > 1 && (
        <Link href={collectionHref ?? href} aria-label={`View all ${photos.length} photos in ${title}`} {...stylex.props(styles.count)}>
          {photos.length} photos
        </Link>
      )}
    </div>
  )
}

const styles = stylex.create({
  link: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
    minHeight: { default: 176, '@media (min-width: 480px)': 220 },
    textDecoration: 'none',
    borderRadius: 4,
    outline: { default: 'none', ':focus-visible': '2px solid currentColor' },
    outlineOffset: 6,
    color: colors.textPrimary,
    gap: 12,
  },
  title: {
    fontSize: 13,
    lineHeight: 1.4,
    textAlign: 'center',
    color: 'inherit',
    textDecoration: 'none',
    maxWidth: 180,
    paddingInline: 4,
    overflowWrap: 'anywhere',
    textWrap: 'pretty',
  },
  stack: {
    display: 'grid',
    placeItems: 'center',
    width: '100%',
    isolation: 'isolate',
    touchAction: 'pan-y pinch-zoom',
    userSelect: 'none',
  },
  print: {
    gridArea: '1 / 1',
    transform: 'var(--print-rest)',
    transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 420ms cubic-bezier(0.22, 1, 0.36, 1)',
    outlineOffset: 4,
    outline: { default: 'none', ':focus-visible': '2px solid currentColor' },
    display: 'flex',
    padding: { default: 5, '@media (min-width: 480px)': 6 },
    backgroundColor: '#fff',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.14), 0 4px 10px rgba(0, 0, 0, 0.1)',
  },
  pose: (index: number, count: number, x: number, y: number, angle: number) => ({
    '--print-response': 1 / (1 + index * 0.6),
    zIndex: { default: count - index, ':focus-visible': count + 1 },
    '--print-rest': index === 0
      ? `rotate(${angle / 8}deg)`
      : `translate(${x * 0.2}px, ${y * 0.2 - index * 2}px) rotate(${angle * 0.5}deg)`,
    '--print-open': index === 0
      ? `translate(0px, -1px) rotate(${angle / 8}deg)`
      : `translate(${x}px, ${y}px) rotate(${angle}deg)`,
  }),
  // Reserve the final content size before the image decoder knows its intrinsic dimensions.
  image: (width: number, height: number) => ({
    display: 'block',
    flexShrink: 0,
    width: { default: width * 120, '@media (min-width: 480px)': width * 160 },
    height: { default: height * 120, '@media (min-width: 480px)': height * 160 },
  }),
  count: {
    textDecoration: { default: 'none', ':hover': 'underline', ':focus-visible': 'underline' },
    textUnderlineOffset: 3,
    marginBlockStart: -8,
    color: '#62626a',
    fontSize: 12,
  },
})
