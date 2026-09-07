import Image from 'next/image'
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

/** First photo is the cover; up to two other photos peek out behind it. */
export default function PhotoStack({ photos, href, title }: { photos: PhotoPrint[]; href: string; title: string }) {
  if (!photos.length) return null
  const visible = photos.slice(0, 3)
  // Stable pseudo-random tilt: identical on the server and on every render.
  const hash = Array.from(href).reduce((value, character) => (Math.imul(value, 31) + character.charCodeAt(0)) | 0, 0)
  const tilt = ((hash >>> 0) % 2 === 0 ? -1 : 1) * (3 + ((hash >>> 0) % 101) / 100)
  return (
    <div data-photo-link data-photo-group={photos.length > 1 ? true : undefined} {...stylex.props(styles.link, styles.tilt(tilt))}>
      <span data-photo-stack {...stylex.props(styles.stack)}>
        {visible.map((photo, index) => (
          <Link href={photo.slug ? `/note/${photo.slug}` : href} aria-label={photo.title} data-photo-print key={`${photo.basename}-${index}`} {...stylex.props(styles.print, styles.pose(index, ((hash >>> (index * 5)) % 101) / 100))}>
            <Image
              src={`/assets/feed/gallery-${photo.basename}`}
              width={photo.width}
              height={photo.height}
              alt=""
              sizes="(max-width: 479px) 120px, 160px"
              {...stylex.props(styles.image)}
            />
          </Link>
        ))}
      </span>
      <Link href={href} {...stylex.props(styles.title)}>{title}</Link>
      {photos.length > 1 && <span aria-hidden="true" {...stylex.props(styles.count)}>{photos.length} photos</span>}
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
  tilt: (angle: number) => ({ '--photo-tilt': `${angle}deg` }),
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
    transform: 'perspective(900px) translateY(0) rotateX(0deg) rotateY(0deg)',
    transformOrigin: '50% 65%',
    transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
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
  pose: (index: number, variation: number) => ({
    zIndex: 3 - index,
    '--print-rest': index === 0
      ? `rotate(${variation * 1.5 - 0.75}deg)`
      : `translate(${(index === 1 ? -1 : 1) * (2 + variation * 2)}px, ${-index * 6}px) rotate(${(index === 1 ? -1 : 1) * (2 + variation * 2)}deg)`,
    '--print-open': index === 0
      ? `translate(0px, -1px) rotate(${variation * 1.5 - 0.75}deg)`
      : `translate(${(index === 1 ? -1 : 1) * (12 + variation * 3)}px, ${-index * 8}px) rotate(${(index === 1 ? -1 : 1) * (4 + variation * 2)}deg)`,
  }),
  image: {
    display: 'block',
    width: 'auto',
    height: 'auto',
    maxWidth: { default: 120, '@media (min-width: 480px)': 160 },
    maxHeight: { default: 120, '@media (min-width: 480px)': 160 },
  },
  count: {
    marginBlockStart: -8,
    color: '#62626a',
    fontSize: 12,
  },
})
