import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const size = {
  width: 1200,
  height: 600,
}
// Output depends only on the text, so let the CDN keep it. Vercel purges its CDN
// cache on every deployment; max-age=0 keeps browsers from holding old designs.
const CACHE_CONTROL = 'public, max-age=0, s-maxage=31536000, stale-while-revalidate=86400'

let background: Promise<string> | undefined
function templateBackground() {
  background ??= readFile(path.join(process.cwd(), 'public/images/og-template.png'))
    .then(template => `data:image/png;base64,${template.toString('base64')}`)
    .catch(error => {
      background = undefined
      throw error
    })
  return background
}

export async function textSocialImage(title: string, description: string) {
  try {
    const background = await templateBackground()
    const values = {
      title: title || 'Why did you not set a title?',
      description: description.slice(0, 180) || '',
    }

    values.title = values.title.length > 100 ? values.title.slice(0, 100) + '...' : values.title

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${background})`,
            backgroundSize: 'cover',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
          <h2
            key="title"
            style={{
              color: '#363636',
              fontSize: values.title.length > 60 ? 64 : 80,
              lineHeight: 1.1,
              marginTop: 0,
              marginBottom: 28,
              letterSpacing: '-0.1rem',
              width: '90%',
            }}
          >
            {values.title}
          </h2>
          <p
            key="description"
            style={{
              color: '#808080',
              fontSize: '2rem',
              width: '90%',
              lineHeight: 1.3,
              marginTop: '0',
              marginBottom: '5rem',
              letterSpacing: '0',
            }}
          >
            {values.description}
          </p>
        </div>
      ),
      { ...size, headers: { 'Cache-Control': CACHE_CONTROL } }
    )
  } catch (error) {
    console.error(error)
    return new Response(`Failed to generate image`, {
      status: 500,
    })
  }
}
