import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const size = {
  width: 1200,
  height: 630,
}
// Output depends only on the content, so let the CDN keep it. Vercel purges its CDN
// cache on every deployment; max-age=0 keeps browsers from holding old designs.
const CACHE_CONTROL = 'public, max-age=0, s-maxage=31536000, stale-while-revalidate=86400'
const INK = '#1f1f1f'

// Satori needs font files, not system fonts. Latin Extended covers names like Muñoz.
let fonts: Promise<Buffer[]> | undefined
function interFonts() {
  fonts ??= Promise.all([
    readFile(path.join(process.cwd(), 'app/fonts/inter/inter-latin-400-normal.woff')),
    readFile(path.join(process.cwd(), 'app/fonts/inter/inter-latin-ext-400-normal.woff')),
  ]).catch(error => {
    fonts = undefined
    throw error
  })
  return fonts
}

// Literal paths keep file tracing to these two images.
const templates = {
  notes: () => readFile(path.join(process.cwd(), 'public/images/og-mamuso-base-notes.png')),
  images: () => readFile(path.join(process.cwd(), 'public/images/og-mamuso-base-images.png')),
}
const backgrounds = new Map<keyof typeof templates, Promise<string>>()
function templateBackground(kind: keyof typeof templates) {
  let background = backgrounds.get(kind)
  if (!background) {
    background = templates[kind]()
      .then(template => `data:image/png;base64,${template.toString('base64')}`)
      .catch(error => {
        backgrounds.delete(kind)
        throw error
      })
    backgrounds.set(kind, background)
  }
  return background
}

/** A rough Inter advance width, enough to pick a size before Satori lays text out. */
function estimateWidth(text: string, fontSize: number) {
  let em = 0
  for (const char of text) em += char === ' ' ? 0.26 : /[A-Z0-9]/.test(char) ? 0.66 : /[iljtf.,:;'!|]/.test(char) ? 0.3 : /[mwMW]/.test(char) ? 0.84 : 0.56
  return em * fontSize
}

function estimateLines(text: string, fontSize: number, width: number) {
  let lines = 1
  let line = 0
  for (const word of text.split(/\s+/)) {
    const wordWidth = estimateWidth(word, fontSize)
    const spaced = line ? line + estimateWidth(' ', fontSize) + wordWidth : wordWidth
    if (line && spaced > width) {
      lines++
      line = wordWidth
    } else line = spaced
    // A word wider than the column breaks across lines.
    while (line > width) {
      lines++
      line -= width
    }
  }
  return lines
}

type TitleBox = { width: number; height: number; sizes: readonly number[]; lineHeight: number }

/** The largest size whose lines fit the box; the smallest one clamps anything longer. */
function fitTitle(title: string, box: TitleBox) {
  const clean = title.trim() || 'Why did you not set a title?'
  for (const fontSize of box.sizes) {
    const lines = estimateLines(clean, fontSize, box.width)
    if (lines * fontSize * box.lineHeight <= box.height) return { text: clean, fontSize, lines }
  }
  const fontSize = box.sizes.at(-1)!
  return { text: clean, fontSize, lines: Math.floor(box.height / (fontSize * box.lineHeight)) }
}

function Title({ title, box, style }: { title: string; box: TitleBox; style: React.CSSProperties }) {
  const { text, fontSize, lines } = fitTitle(title, box)
  return (
    <div
      style={{
        position: 'absolute',
        display: 'block',
        width: box.width,
        // Room below the last baseline, so clipping never cuts descenders.
        maxHeight: box.height + fontSize * 0.3,
        paddingBottom: fontSize * 0.3,
        overflow: 'hidden',
        color: INK,
        fontFamily: 'Inter',
        fontSize,
        lineHeight: box.lineHeight,
        letterSpacing: '-0.03em',
        wordBreak: 'break-word',
        lineClamp: lines,
        ...style,
      }}
    >
      {text}
    </div>
  )
}

async function render(node: React.ReactElement) {
  try {
    const fonts = (await interFonts()).map(data => ({ name: 'Inter', data, weight: 400 as const, style: 'normal' as const }))
    return new ImageResponse(node, {
      ...size,
      fonts,
      headers: { 'Cache-Control': CACHE_CONTROL },
    })
  } catch (error) {
    console.error(error)
    return new Response('Failed to generate image', { status: 500 })
  }
}

// Clear of the cartridge, which starts at x = 935.
const NOTE_TITLE: TitleBox = { width: 780, height: 440, sizes: [88, 76, 64, 54], lineHeight: 1.04 }

export async function textSocialImage(title: string) {
  const background = await templateBackground('notes')
  return render(
    <div style={{ display: 'flex', width: '100%', height: '100%', backgroundImage: `url(${background})`, backgroundSize: '100% 100%' }}>
      <Title title={title} box={NOTE_TITLE} style={{ left: 88, top: 104 }} />
    </div>
  )
}

export type SocialPhoto = { src: string; width?: number; height?: number }

/** Feed JPEGs are fetched from the site itself so photo binaries stay out of the function bundle. */
export function feedPhoto({ basename, width, height }: { basename: string; width?: number; height?: number }, request: Request): SocialPhoto {
  return { src: new URL(`/assets/feed/${encodeURIComponent(basename)}`, request.url).href, width, height }
}

// Stacked shadows with negative spread: a hairline edge, then soft layers that tighten as they fall.
const PHOTO_SHADOW = ['0 0 0 1px', '0 1px 1px -0.5px', '0 3px 3px -1.5px', '0 6px 6px -3px', '0 12px 12px -6px', '0 24px 24px -12px']
  .map(layer => `${layer} rgba(0, 0, 0, 0.04)`)
  .join(', ')

// The photo window on the label, and the title column beside it.
const FRAME = { left: 520, top: 177, width: 480, height: 300, radius: 14 }
const PHOTO_TITLE: TitleBox = { width: 290, height: 250, sizes: [58, 50, 42, 36], lineHeight: 1.02 }

/**
 * Every photo fills the horizontal frame. Landscape crops stay centred; portrait
 * crops sit near the top, where faces and horizons tend to be.
 */
function Photo({ photo, style }: { photo: SocialPhoto; style?: React.CSSProperties }) {
  const ratio = photo.width && photo.height ? photo.width / photo.height : 3 / 2
  const frameRatio = FRAME.width / FRAME.height
  const width = ratio > frameRatio ? FRAME.height * ratio : FRAME.width
  const height = width / ratio
  const left = (FRAME.width - width) / 2
  const top = (FRAME.height - height) * (ratio < 1 ? 0.2 : 0.5)
  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        left: FRAME.left,
        top: FRAME.top,
        width: FRAME.width,
        height: FRAME.height,
        borderRadius: FRAME.radius,
        overflow: 'hidden',
        backgroundColor: '#c8c8c8',
        boxShadow: PHOTO_SHADOW,
        ...style,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img elements. */}
      <img src={photo.src} alt="" width={width} height={height} style={{ position: 'absolute', left, top, width, height }} />
    </div>
  )
}

/** A single photo, or a stack when a second photo sits slightly askew behind it. */
export async function photoSocialImage(title: string, photos: readonly SocialPhoto[]) {
  const background = await templateBackground('images')
  const [cover, behind] = photos
  return render(
    <div style={{ display: 'flex', width: '100%', height: '100%', backgroundImage: `url(${background})`, backgroundSize: '100% 100%' }}>
      <Title title={title} box={PHOTO_TITLE} style={{ left: 198, top: 238 }} />
      {behind && <Photo photo={behind} style={{ opacity: 0.7, transform: 'translate(6px, 8px) rotate(-2.5deg)' }} />}
      {cover && <Photo photo={cover} />}
    </div>
  )
}
