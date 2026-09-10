import { Fragment } from 'react'
import type { PhotoMetadata } from '@/lib/types'
import { formatPostDate } from '@/lib/editorial-date'
import * as stylex from '@stylexjs/stylex'
import PaperSurface from './PaperSurface'
import PaletteDab from './PaletteDab'
import { paletteVariants } from './palette-variants'
import localFont from 'next/font/local'
import { PAPER_SETTINGS, paperWearSeed } from './paper-settings'

const courierPrime = localFont({
  src: [
    { path: '../fonts/courier-prime/CourierPrime-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../fonts/courier-prime/CourierPrime-Bold.ttf', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  fallback: ['Courier New', 'Courier', 'monospace'],
})

type Props = {
  post: PhotoMetadata & { title: string; slug: string; date: string }
  orientation?: 'portrait' | 'landscape'
}

export default function PhotoMeta({ post, orientation = 'portrait' }: Props) {
  const slotProps = stylex.props(styles.slot)
  const rotation = (paperWearSeed(`card-rotation:${post.slug}`) / 0xffffffff) * 2 - 1
  const hasPalette = Boolean(post.colorPalette?.length)
  const variants = paletteVariants(paperWearSeed(`palette:${post.slug}`))
  const exposure = [
    post.fnumber ? `ƒ/${post.fnumber}` : undefined,
    post.exposureTime ? `${post.exposureTime}s` : undefined,
    post.iso ? `ISO ${post.iso}` : undefined,
    post.exposureBiasValue !== undefined ? `${post.exposureBiasValue > 0 ? '+' : ''}${post.exposureBiasValue} EV` : undefined,
  ].filter(Boolean)
  const titleRule = '-'.repeat(Array.from(post.title).length)

  return (
    <div {...slotProps} className={`${slotProps.className} ${courierPrime.className}`}>
      <section aria-label={`Photo details: ${post.title}`} data-photo-paper data-paper-orientation={orientation} {...stylex.props(styles.paper, orientation === 'landscape' && styles.landscape, styles.corners(PAPER_SETTINGS.cornerRadius), styles.rotation(rotation))}>
        <PaperSurface identity={post.slug} />
        <div data-paper-grid {...stylex.props(styles.grid, orientation === 'portrait' ? styles.portraitGrid : styles.landscapeGrid, hasPalette && styles.gridWithPalette)}>
          <div {...stylex.props(styles.titleColumn, orientation === 'landscape' && styles.landscapeTitle)}>
            <h3 {...stylex.props(styles.title)}>{post.title}</h3>
            <div aria-hidden="true" {...stylex.props(styles.rule, orientation === 'landscape' && styles.singleLineRule)}>{titleRule}</div>
          </div>
          <div {...stylex.props(styles.detailsColumn, orientation === 'landscape' && styles.landscapeDetails)}>
            <dl {...stylex.props(styles.metadata, orientation === 'landscape' && styles.landscapeMetadata)}>
              {(post.camera || exposure.length > 0) && (
                <div>
                  {post.camera && <><dt {...stylex.props(styles.visuallyHidden)}>Camera</dt><dd {...stylex.props(styles.value)}>{post.camera}</dd></>}
                  {exposure.length > 0 && <><dt {...stylex.props(styles.visuallyHidden)}>Exposure</dt><dd {...stylex.props(styles.value)}>
                    {exposure.map((field, index) => (
                      <Fragment key={field}>
                        <span {...stylex.props(styles.exposureField)}>{field}{index < exposure.length - 1 ? ',' : ''}</span>
                        {index < exposure.length - 1 ? ' ' : null}
                      </Fragment>
                    ))}
                  </dd></>}
                </div>
              )}
              {post.GPSLatitude !== undefined && post.GPSLongitude !== undefined && (
                <div><dt {...stylex.props(styles.visuallyHidden)}>Coordinates</dt><dd {...stylex.props(styles.value)}>{post.GPSLatitude}, {post.GPSLongitude}</dd></div>
              )}
            </dl>
            <p data-paper-date {...stylex.props(styles.value, styles.date)}>
              <time dateTime={post.date}>{formatPostDate(post.date, true)}</time>
            </p>
            {post.colorPalette && post.colorPalette.length > 0 && (
              <div data-paper-palette {...stylex.props(styles.palette, orientation === 'landscape' && styles.landscapePalette)}>
                <span {...stylex.props(styles.visuallyHidden)}>Palette</span>
                {post.colorPalette.map((color, index) => (
                  <PaletteDab key={`${color}-${index}`} color={color} variant={variants[index % variants.length]}
                    rotation={(paperWearSeed(`${post.slug}:dab:${index}`) / 0xffffffff) * 4 - 2} />
                ))}
              </div>
            )}
          </div>
        </div>
        <div aria-hidden="true" data-paper-footer {...stylex.props(styles.footer)} />
      </section>
    </div>
  )
}

const styles = stylex.create({
  slot: { display: 'grid', justifyItems: 'center', width: '100%', minWidth: 0 },
  // Full-bleed grid; width and content rhythm use complete 24px units.
  paper: {
    position: 'relative', isolation: 'isolate', boxSizing: 'border-box',
    width: 'round(down, 100%, 24px)', maxWidth: 432, overflow: 'hidden',
    color: '#000000cc', fontSize: 16, fontWeight: 400, lineHeight: '24px',
    boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.045), 0 1px 1px -0.5px rgba(0, 0, 0, 0.045), 0 2px 3px -1.5px rgba(0, 0, 0, 0.045), 0 4px 6px -3px rgba(0, 0, 0, 0.045), 0 9px 12px -6px rgba(0, 0, 0, 0.045), 0 18px 24px -12px rgba(0, 0, 0, 0.045)',
  },
  corners: (radius: number) => ({ borderRadius: radius }),
  rotation: (degrees: number) => ({ transform: `rotate(${degrees}deg)` }),
  landscape: { maxWidth: { default: 432, '@media (min-width: 1080px)': 720 } },
  grid: {
    // Keep the 24px grid rhythm with a 16px font.
    position: 'relative', paddingInline: 24, paddingTop: 32, paddingBottom: 40,
    // Start each set of lines one cell in, without drawing an outer border.
    backgroundImage: 'repeating-linear-gradient(to right, rgba(255, 255, 255, 0.8) 0 1px, transparent 1px 24px), repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.8) 0 1px, transparent 1px 24px)',
    backgroundSize: 'calc(100% - 24px) 100%, 100% calc(100% - 24px)',
    backgroundPosition: '24px 0, 0 24px',
    backgroundRepeat: 'no-repeat',
  },
  portraitGrid: { paddingLeft: { default: 24, '@media (min-width: 1080px)': 72 } },
  landscapeGrid: { display: { default: 'block', '@media (min-width: 1080px)': 'grid' }, gridTemplateColumns: { default: 'none', '@media (min-width: 1080px)': '240px minmax(0, 1fr)' }, columnGap: 48, paddingTop: { default: 32, '@media (min-width: 1080px)': 56 } },
  titleColumn: { minWidth: 0 },
  landscapeTitle: { paddingLeft: { default: 0, '@media (min-width: 1080px)': 24 } },
  detailsColumn: { display: 'flow-root', minWidth: 0 },
  landscapeDetails: { display: { default: 'flow-root', '@media (min-width: 1080px)': 'flex' }, flexDirection: 'column' },
  landscapeMetadata: { marginTop: { default: 24, '@media (min-width: 1080px)': 0 } },
  landscapePalette: { marginTop: { default: 16, '@media (min-width: 1080px)': 'auto' }, paddingTop: { default: 0, '@media (min-width: 1080px)': 16 } },
  singleLineRule: { whiteSpace: { default: 'normal', '@media (min-width: 1080px)': 'nowrap' }, overflow: { default: 'visible', '@media (min-width: 1080px)': 'hidden' } },
  gridWithPalette: { paddingBottom: 0 },
  title: { margin: 0, fontSize: 'inherit', fontWeight: 'inherit', lineHeight: '24px', overflowWrap: 'anywhere' },
  rule: { overflowWrap: 'anywhere' },
  metadata: { display: 'grid', margin: 0, marginTop: 24 },
  exposureField: { whiteSpace: 'nowrap' },
  value: { margin: 0, overflowWrap: 'anywhere', fontVariantNumeric: 'tabular-nums' },
  date: { marginTop: 24 },
  palette: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 0, rowGap: 0, marginTop: 16, position: 'relative', zIndex: 1, transform: 'translateY(12px)' },
  footer: { position: 'relative', height: 48, boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.8)' },
  visuallyHidden: { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap', borderWidth: 0 },
})
