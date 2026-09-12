import Image from 'next/image'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import PhotoStackMotion from './PhotoStackMotion'
import { typography } from '../styles/site'
import { colors } from '../styles/tokens.stylex'

type Photo = { basename: string; width: number; height: number }

export default function HomePhotos({ photos }: { photos: Photo[] }) {
  return (
    <Link href="/photos" draggable={false} aria-labelledby="home-photos" {...stylex.props(styles.module)}>
      <h2 id="home-photos" {...stylex.props(typography.display, typography.muted, styles.heading)}>Say cheese</h2>
      {photos.map((photo, index) => {
        const row = index < 3 ? 1 : 2
        const column = index < 3 ? index + 3 : index - 2
        const longest = Math.max(photo.width, photo.height)
        return (
          <PhotoStackMotion key={photo.basename} data-photo-stack aria-hidden="true" {...stylex.props(styles.slot(row, column))}>
            <span data-photo-print {...stylex.props(styles.print)}>
              <Image src={`/assets/feed/gallery-${photo.basename}`} width={photo.width} height={photo.height}
                alt="" draggable={false} sizes="(max-width: 479px) 40px, (max-width: 1023px) 56px, 64px"
                {...stylex.props(styles.image(photo.width / longest, photo.height / longest))} />
            </span>
          </PhotoStackMotion>
        )
      })}
    </Link>
  )
}

const styles = stylex.create({
  module: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gridTemplateRows: { default: 'repeat(2, 72px)', '@media (min-width: 480px)': 'repeat(2, 92px)' },
    columnGap: { default: 0, '@media (min-width: 640px)': 8 },
    rowGap: 4,
    paddingBlockStart: 64,
    paddingBlockEnd: 32,
    paddingInlineStart: { default: 0, '@media (min-width: 880px)': 32 },
    color: 'inherit',
    textDecoration: 'none',
    outlineOffset: 4,
  },
  heading: {
    gridColumn: '1 / 3',
    gridRow: '1',
    alignSelf: 'start',
    textAlign: 'left',
    fontWeight: 400,
    marginBlock: 0,
  },
  slot: (row: number, column: number) => ({
    gridRow: `${row}`,
    gridColumn: `${column}`,
    display: 'grid',
    placeItems: 'center',
    minWidth: 0,
    touchAction: 'pan-y pinch-zoom',
    userSelect: 'none',
  }),
  print: {
    display: 'block',
    padding: { default: 2.5, '@media (min-width: 480px)': 3 },
    backgroundColor: colors.surface,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.14), 0 4px 10px rgba(0, 0, 0, 0.1)',
  },
  image: (width: number, height: number) => ({
    display: 'block',
    width: { default: width * 40, '@media (min-width: 480px)': width * 56, '@media (min-width: 1024px)': width * 64 },
    height: { default: height * 40, '@media (min-width: 480px)': height * 56, '@media (min-width: 1024px)': height * 64 },
    backgroundColor: colors.placeholder,
  }),
})
