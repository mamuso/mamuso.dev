import type { PhotoMetadata } from '@/lib/types'
import { formatPostDate } from '@/lib/editorial-date'
import * as stylex from '@stylexjs/stylex'
import PaperSurface from './PaperSurface'

type Props = {
  post: PhotoMetadata & { title: string; date: string; width: number; height: number }
}

export default function PhotoMeta({ post }: Props) {
  const exposure = [
    post.fnumber ? `ƒ/${post.fnumber}` : undefined,
    post.exposureTime ? `${post.exposureTime}s` : undefined,
    post.iso ? `ISO ${post.iso}` : undefined,
    post.exposureBiasValue !== undefined ? `${post.exposureBiasValue > 0 ? '+' : ''}${post.exposureBiasValue} EV` : undefined,
  ].filter(Boolean).join(' · ')

  return (
    <div {...stylex.props(styles.slot)}>
      <section aria-label={`Photo details: ${post.title}`} data-photo-paper {...stylex.props(styles.paper)}>
        <PaperSurface />
        <div data-paper-grid {...stylex.props(styles.grid)}>
          <h3 {...stylex.props(styles.title)}>{post.title}</h3>
          <dl {...stylex.props(styles.metadata)}>
            {post.camera && <div><dt {...stylex.props(styles.label)}>Camera</dt><dd {...stylex.props(styles.value)}>{post.camera}</dd></div>}
            {exposure && <div><dt {...stylex.props(styles.label)}>Exposure</dt><dd {...stylex.props(styles.value)}>{exposure}</dd></div>}
            <div><dt {...stylex.props(styles.label)}>Dimensions</dt><dd {...stylex.props(styles.value)}>{post.width} × {post.height} px</dd></div>
            {post.GPSLatitude !== undefined && post.GPSLongitude !== undefined && (
              <div><dt {...stylex.props(styles.label)}>Coordinates</dt><dd {...stylex.props(styles.value)}>{post.GPSLatitude}, {post.GPSLongitude}</dd></div>
            )}
            {post.colorPalette && post.colorPalette.length > 0 && (
              <div><dt {...stylex.props(styles.label)}>Palette</dt><dd {...stylex.props(styles.value, styles.palette)}>
                {post.colorPalette.map((color, index) => (
                  <span key={`${color}-${index}`} title={color} {...stylex.props(styles.swatch(color))}>
                    <span {...stylex.props(styles.visuallyHidden)}>{color}</span>
                  </span>
                ))}
              </dd></div>
            )}
          </dl>
        </div>
        <footer data-paper-date {...stylex.props(styles.date)}>
          <span {...stylex.props(styles.label)}>Date</span>
          <time dateTime={post.date}>{formatPostDate(post.date, true)}</time>
        </footer>
      </section>
    </div>
  )
}

const styles = stylex.create({
  slot: { display: 'grid', justifyItems: 'center', width: '100%', minWidth: 0 },
  // 24px cells, 12px paper margin on both sides: both rectangles use whole units.
  paper: {
    position: 'relative', isolation: 'isolate', boxSizing: 'border-box',
    width: 'round(down, 100%, 24px)', maxWidth: 432, padding: 12,
    color: '#484640', fontSize: 13, lineHeight: '24px',
    filter: 'drop-shadow(0 2px 2px rgba(40, 36, 28, 0.08)) drop-shadow(0 8px 12px rgba(40, 36, 28, 0.05))',
  },
  grid: {
    position: 'relative', padding: 24,
    backgroundImage: 'linear-gradient(to right, rgba(87, 83, 73, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(87, 83, 73, 0.12) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    boxShadow: 'inset -1px -1px 0 rgba(87, 83, 73, 0.12)',
  },
  title: { margin: 0, marginBottom: 24, fontSize: 15, fontWeight: 500, lineHeight: '24px', overflowWrap: 'anywhere' },
  metadata: { display: 'grid', gap: 24, margin: 0 },
  label: { fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#716d64', lineHeight: '24px' },
  value: { margin: 0, overflowWrap: 'anywhere', fontVariantNumeric: 'tabular-nums' },
  palette: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 0 },
  swatch: (color: string) => ({ display: 'inline-block', width: 16, height: 16, marginBlock: 4, backgroundColor: color, boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.08)' }),
  date: { position: 'relative', display: 'flex', flexWrap: 'wrap', columnGap: 12, paddingBlock: 12, paddingInline: 24, lineHeight: '24px', fontVariantNumeric: 'tabular-nums' },
  visuallyHidden: { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap', borderWidth: 0 },
})
