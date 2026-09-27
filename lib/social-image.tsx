import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { BLOG_URL } from './constants'

export const size = {
  width: 1200,
  height: 630,
}
// Output depends only on the content, so let the CDN keep it. Vercel purges its CDN
// cache on every deployment; max-age=0 keeps browsers from holding old designs.
const CACHE_CONTROL = 'public, max-age=0, s-maxage=31536000, stale-while-revalidate=86400'
const INK = '#1f1f1f'

// Satori needs a font file, not a system font. This Latin subset of SF Pro Display
// Medium is 71 KB, against 6 MB for the full font, and covers names like Muñoz.
// It keeps kerning but drops GSUB, whose extension lookups Satori cannot parse.
let font: Promise<Buffer> | undefined
function titleFont() {
  font ??= readFile(path.join(process.cwd(), 'app/fonts/sf/SF-Pro-Display-Medium-latin.otf')).catch(error => {
    font = undefined
    throw error
  })
  return font
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

const LETTER_SPACING = -0.01

/** A rough SF Pro Display advance width, enough to pick a size before Satori lays text out. */
function estimateWidth(text: string, fontSize: number) {
  let em = 0
  for (const char of text) em += (char === ' ' ? 0.26 : /[A-Z0-9]/.test(char) ? 0.66 : /[iljtf.,:;'!|]/.test(char) ? 0.3 : /[mwMW]/.test(char) ? 0.84 : 0.56) + LETTER_SPACING
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
        fontFamily: 'SF Pro Display',
        fontSize,
        lineHeight: box.lineHeight,
        letterSpacing: `${LETTER_SPACING}em`,
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
    return new ImageResponse(node, {
      ...size,
      fonts: [{ name: 'SF Pro Display', data: await titleFont(), weight: 500, style: 'normal' }],
      headers: { 'Cache-Control': CACHE_CONTROL },
    })
  } catch (error) {
    console.error(error)
    return new Response('Failed to generate image', { status: 500 })
  }
}

// Clear of the cartridge, which starts at x = 935.
const NOTE_TITLE: TitleBox = { width: 780, height: 440, sizes: [80, 70, 60, 52], lineHeight: 0.9 }

export async function textSocialImage(title: string) {
  const background = await templateBackground('notes')
  return render(
    <div style={{ display: 'flex', width: '100%', height: '100%', backgroundImage: `url(${background})`, backgroundSize: '100% 100%' }}>
      <Title title={title} box={NOTE_TITLE} style={{ left: 87, top: 117 }} />
    </div>
  )
}

export type SocialPhoto = { src: string; width?: number; height?: number }

/**
 * Feed JPEGs come from the site itself, so photo binaries stay out of the function
 * bundle, through the image optimizer: a 1080px JPEG decodes several times faster
 * than the 2048px original and still covers the 480px frame at 2x.
 */
export function feedPhoto({ basename, width, height }: { basename: string; width?: number; height?: number }, request: Request): SocialPhoto {
  const url = new URL('/_next/image', request.url)
  url.search = new URLSearchParams({ url: `/assets/feed/${basename}`, w: '1080', q: '75' }).toString()
  return { src: url.href, width, height }
}

async function fetchImage(url: string) {
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  const response = await fetch(url, {
    // A protected deployment redirects to its login page; treat that as a failure.
    redirect: 'manual',
    // Satori decodes JPEG and PNG, not the WebP or AVIF the optimizer prefers.
    headers: { accept: 'image/jpeg,image/png', ...(bypass && { 'x-vercel-protection-bypass': bypass }) },
  })
  const type = response.headers.get('content-type') ?? ''
  if (!response.ok || !/^image\/(jpeg|png)/.test(type)) throw new Error(`${response.status} ${type}`)
  return `data:${type};base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`
}

/**
 * Satori would fetch the photo itself, but protected preview deployments answer
 * with a login redirect. Fetching here can carry Vercel's automation bypass when the
 * project enables it, and otherwise falls back to the published site: feed filenames
 * are content hashes, so the same path there is the same photo. A photo that still
 * fails leaves its frame empty rather than failing the image.
 */
async function loadPhoto(photo: SocialPhoto): Promise<SocialPhoto | null> {
  const own = new URL(photo.src)
  const published = new URL(own.pathname + own.search, BLOG_URL)
  for (const url of own.origin === published.origin ? [own] : [own, published]) {
    try {
      return { ...photo, src: await fetchImage(url.href) }
    } catch (error) {
      console.error(`Social image photo unavailable: ${url.href}`, error)
    }
  }
  return null
}

// The photo window on the label, and the title column beside it.
const FRAME = { left: 520, top: 177, width: 480, height: 300, radius: 14 }
const PHOTO_TITLE: TitleBox = { width: 290, height: 250, sizes: [60, 52, 44, 38], lineHeight: 0.9 }

// Stacked shadows with negative spread: a hairline edge, then soft layers that tighten as they fall.
const PHOTO_SHADOW = ['0 0 0 1px', '0 1px 1px -0.5px', '0 3px 3px -1.5px', '0 6px 6px -3px', '0 12px 12px -6px', '0 24px 24px -12px']
  .map(layer => `${layer} rgba(0, 0, 0, 0.04)`)
  .join(', ')
// Room around the frame for the deepest layer: 24px down plus 24px of blur, less 12px of spread.
const SHADOW_PAD = 40

// Blurring six shadow layers costs half a second per photo, and the frame never
// changes size, so each server instance draws the shadow once and reuses it.
let shadow: Promise<string> | undefined
function frameShadow() {
  shadow ??= new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        <div
          style={{
            position: 'absolute',
            left: SHADOW_PAD,
            top: SHADOW_PAD,
            width: FRAME.width,
            height: FRAME.height,
            borderRadius: FRAME.radius,
            backgroundColor: '#c8c8c8',
            boxShadow: PHOTO_SHADOW,
          }}
        />
      </div>
    ),
    { width: FRAME.width + SHADOW_PAD * 2, height: FRAME.height + SHADOW_PAD * 2 },
  ).arrayBuffer()
    .then(png => `data:image/png;base64,${Buffer.from(png).toString('base64')}`)
    .catch(error => {
      shadow = undefined
      throw error
    })
  return shadow
}

/**
 * Every photo fills the horizontal frame. Landscape crops stay centred; portrait
 * crops sit near the top, where faces and horizons tend to be.
 */
function Photo({ photo, shadow, style }: { photo: SocialPhoto; shadow: string; style?: React.CSSProperties }) {
  const ratio = photo.width && photo.height ? photo.width / photo.height : 3 / 2
  const frameRatio = FRAME.width / FRAME.height
  const width = ratio > frameRatio ? FRAME.height * ratio : FRAME.width
  const height = width / ratio
  const left = (FRAME.width - width) / 2
  const top = (FRAME.height - height) * (ratio < 1 ? 0.2 : 0.5)
  const shadowSize = { width: FRAME.width + SHADOW_PAD * 2, height: FRAME.height + SHADOW_PAD * 2 }
  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        left: FRAME.left,
        top: FRAME.top,
        width: FRAME.width,
        height: FRAME.height,
        ...style,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img elements. */}
      <img src={shadow} alt="" {...shadowSize} style={{ position: 'absolute', left: -SHADOW_PAD, top: -SHADOW_PAD, ...shadowSize }} />
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          width: FRAME.width,
          height: FRAME.height,
          borderRadius: FRAME.radius,
          overflow: 'hidden',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img elements. */}
        <img src={photo.src} alt="" width={width} height={height} style={{ position: 'absolute', left, top, width, height }} />
      </div>
    </div>
  )
}

/** A single photo, or a stack when a second photo sits slightly askew behind it. */
export async function photoSocialImage(title: string, photos: readonly SocialPhoto[]) {
  const [background, shadow, [cover, behind]] = await Promise.all([
    templateBackground('images'),
    frameShadow(),
    Promise.all(photos.slice(0, 2).map(loadPhoto)),
  ])
  return render(
    <div style={{ display: 'flex', width: '100%', height: '100%', backgroundImage: `url(${background})`, backgroundSize: '100% 100%' }}>
      <Title title={title} box={PHOTO_TITLE} style={{ left: 198, top: 238 }} />
      {behind && <Photo photo={behind} shadow={shadow} style={{ opacity: 0.7, transform: 'translate(6px, 8px) rotate(-2.5deg)' }} />}
      {cover && <Photo photo={cover} shadow={shadow} />}
    </div>
  )
}
