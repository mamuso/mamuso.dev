import Image from 'next/image'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'

export interface PhotoPrint {
  basename: string
  width: number
  height: number
  title: string
}

/** First photo is the cover; up to two other photos peek out behind it. */
export default function PhotoStack({ photos, href, title }: { photos: PhotoPrint[]; href: string; title: string }) {
  if (!photos.length) return null
  const visible = photos.slice(0, 3)
  return (
    <Link href={href} aria-label={photos.length > 1 ? `${title} · ${photos.length} photos` : title} {...stylex.props(styles.link)}>
      <span {...stylex.props(styles.stack)}>
        {visible.map((photo, index) => (
          <span key={`${photo.basename}-${index}`} {...stylex.props(styles.print, index === 0 ? styles.cover : index === 1 ? styles.middle : styles.back)}>
            <Image
              src={`/assets/feed/gallery-${photo.basename}`}
              width={photo.width}
              height={photo.height}
              alt=""
              sizes="(max-width: 479px) 120px, 160px"
              {...stylex.props(styles.image)}
            />
          </span>
        ))}
      </span>
      {photos.length > 1 && <span aria-hidden="true" {...stylex.props(styles.count)}>{photos.length} photos</span>}
    </Link>
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
    transform: { default: 'translateY(0)', ':hover': 'translateY(-3px)', ':focus-visible': 'translateY(-3px)' },
    transition: { default: 'transform 180ms ease', '@media (prefers-reduced-motion: reduce)': 'none' },
  },
  stack: {
    display: 'grid',
    placeItems: 'center',
    width: '100%',
    isolation: 'isolate',
  },
  print: {
    gridArea: '1 / 1',
    display: 'flex',
    padding: { default: 5, '@media (min-width: 480px)': 6 },
    backgroundColor: '#fff',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.14), 0 4px 10px rgba(0, 0, 0, 0.1)',
  },
  cover: { zIndex: 3 },
  middle: { zIndex: 2, transform: 'translate(-5px, -3px) rotate(-9deg)' },
  back: { zIndex: 1, transform: 'translate(5px, 1px) rotate(8deg)' },
  image: {
    display: 'block',
    width: 'auto',
    height: 'auto',
    maxWidth: { default: 120, '@media (min-width: 480px)': 160 },
    maxHeight: { default: 120, '@media (min-width: 480px)': 160 },
  },
  count: {
    position: 'absolute',
    bottom: 0,
    color: '#62626a',
    fontSize: 12,
  },
})
