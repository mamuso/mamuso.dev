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
  const exposureLines = [
    [post.fnumber ? `ƒ/${post.fnumber}` : undefined, post.exposureTime ? `${post.exposureTime}s` : undefined],
    [post.iso ? `ISO ${post.iso}` : undefined, post.exposureBiasValue !== undefined ? `${post.exposureBiasValue > 0 ? '+' : ''}${post.exposureBiasValue} EV` : undefined],
  ].map((line) => line.filter((field): field is string => field !== undefined)).filter((line) => line.length > 0)
  const titleRule = '-'.repeat(Array.from(post.title).length)

  return (
    <div {...slotProps} className={`${slotProps.className} ${courierPrime.className}`}>
      <section aria-label={`Photo details: ${post.title}`} data-photo-paper data-paper-orientation={orientation} {...stylex.props(styles.paper, orientation === 'portrait' && styles.portraitPaper, orientation === 'landscape' && styles.landscape, styles.corners(PAPER_SETTINGS.cornerRadius), styles.rotation(rotation))}>
        <PaperSurface identity={post.slug} />
        <div data-paper-grid {...stylex.props(styles.grid, orientation === 'portrait' ? styles.portraitGrid : styles.landscapeGrid, hasPalette && styles.gridWithPalette)}>
          <div {...stylex.props(styles.titleColumn, orientation === 'landscape' && styles.landscapeTitle)}>
            <h3 {...stylex.props(styles.title)}>{post.title}</h3>
            <div aria-hidden="true" {...stylex.props(styles.rule)}>{titleRule}</div>
          </div>
          <div {...stylex.props(styles.detailsColumn, orientation === 'landscape' && styles.landscapeDetails)}>
            <dl {...stylex.props(styles.metadata, orientation === 'landscape' && styles.landscapeMetadata)}>
              {(post.camera || exposureLines.length > 0) && (
                <div>
                  {post.camera && <><dt {...stylex.props(styles.visuallyHidden)}>Camera</dt><dd {...stylex.props(styles.value)}>{post.camera}</dd></>}
                  {exposureLines.map((line, lineIndex) => (
                    <Fragment key={line.join('|')}>
                      <dt {...stylex.props(styles.visuallyHidden)}>Exposure {lineIndex + 1}</dt>
                      <dd {...stylex.props(styles.value)}>
                        {line.map((field, index) => (
                          <Fragment key={field}>
                            <span {...stylex.props(styles.exposureField)}>{field}</span>
                            {index < line.length - 1 ? ' ' : null}
                          </Fragment>
                        ))}
                      </dd>
                    </Fragment>
                  ))}
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
  // Full-bleed grid; width and content rhythm use complete 20px units.
  paper: {
    position: 'relative', isolation: 'isolate', boxSizing: 'border-box',
    width: 'round(down, 100%, 20px)', maxWidth: 440, overflow: 'hidden',
    color: '#000000cc', fontSize: 16, fontWeight: 400, lineHeight: '20px',
    boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.045), 0 1px 1px -0.5px rgba(0, 0, 0, 0.045), 0 2px 3px -1.5px rgba(0, 0, 0, 0.045), 0 4px 6px -3px rgba(0, 0, 0, 0.045), 0 9px 12px -6px rgba(0, 0, 0, 0.045), 0 18px 24px -12px rgba(0, 0, 0, 0.045)',
  },
  corners: (radius: number) => ({ borderRadius: radius }),
  rotation: (degrees: number) => ({ transform: `rotate(${degrees}deg)` }),
  portraitPaper: { marginLeft: { default: 0, '@media (min-width: 1080px)': -20 } },
  landscape: { maxWidth: { default: 440, '@media (min-width: 1080px)': 720 } },
  grid: {
    // A 26px top inset puts Courier Prime's first 20px line on the grid.
    // 26px + 34px leaves the content area on a complete 20px grid row.
    position: 'relative', paddingInline: 20, paddingTop: 26, paddingBottom: 34,
    // Start each set of lines one cell in, without drawing an outer border.
    backgroundImage: 'repeating-linear-gradient(to right, rgba(255, 255, 255, 0.8) 0 1px, transparent 1px 20px), repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.8) 0 1px, transparent 1px 20px)',
    // Column lines stop at the last complete 20px row, so content that falls
    // off the rhythm leaves a clean edge instead of a partial cell.
    backgroundSize: 'calc(100% - 20px) round(down, 100%, 20px), 100% calc(100% - 20px)',
    backgroundPosition: '20px 0, 0 20px',
    backgroundRepeat: 'no-repeat',
  },
  portraitGrid: { paddingLeft: { default: 20, '@media (min-width: 1080px)': 80 } },
  landscapeGrid: { display: { default: 'block', '@media (min-width: 1080px)': 'grid' }, gridTemplateColumns: { default: 'none', '@media (min-width: 1080px)': '200px minmax(0, 1fr)' }, columnGap: 40, paddingTop: { default: 26, '@media (min-width: 1080px)': 46 } },
  titleColumn: { minWidth: 0 },
  landscapeTitle: { paddingLeft: { default: 0, '@media (min-width: 1080px)': 20 } },
  detailsColumn: { display: 'flow-root', minWidth: 0 },
  landscapeDetails: { display: { default: 'flow-root', '@media (min-width: 1080px)': 'flex' }, flexDirection: 'column' },
  landscapeMetadata: { marginTop: { default: 20, '@media (min-width: 1080px)': 0 } },
  landscapePalette: { marginTop: { default: 20, '@media (min-width: 1080px)': 'auto' }, paddingTop: { default: 0, '@media (min-width: 1080px)': 20 } },
  // The palette block is 68px tall (20px margin + 48px dabs); 6px more lands
  // the grid back on a complete 20px row so the footer line closes the cells.
  gridWithPalette: { paddingBottom: 6 },
  title: { margin: 0, fontSize: 'inherit', fontWeight: 'inherit', lineHeight: '20px', overflowWrap: 'anywhere' },
  rule: { whiteSpace: 'nowrap', overflow: 'hidden' },
  metadata: { display: 'grid', margin: 0, marginTop: 20 },
  exposureField: { whiteSpace: 'nowrap' },
  value: { margin: 0, overflowWrap: 'anywhere', fontVariantNumeric: 'tabular-nums' },
  date: { marginTop: 20 },
  palette: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 0, rowGap: 0, marginTop: 20, position: 'relative', zIndex: 1, transform: 'translateY(10px)' },
  footer: { position: 'relative', height: 40, boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.8)' },
  visuallyHidden: { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap', borderWidth: 0 },
})
