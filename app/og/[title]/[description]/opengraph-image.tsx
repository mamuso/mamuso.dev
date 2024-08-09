import { ImageResponse } from '@vercel/og'

const geistsans = fetch(new URL('../../../../public/fonts/Geist-Bold.ttf', import.meta.url)).then((res) => res.arrayBuffer())
const monospace = fetch(new URL('../../../../public/fonts/GeistMono-Regular.ttf', import.meta.url)).then((res) => res.arrayBuffer())

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = {
  width: 1200,
  height: 600,
}
export default async function Image({ params }: { params: { title: string; description: string } }) {
  try {
    const geistsansData = await geistsans
    const monospaceData = await monospace

    const values = {
      title: params.title || 'Why did you not set a title?',
      description: params.description || '',
    }

    values.title = values.title.length > 100 ? values.title.slice(0, 100) + '...' : values.title

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(https://mamuso.dev/images/og-template.png)`,
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
              fontSize: '7rem',
              fontFamily: 'geistsans',
              lineHeight: '8.5rem',
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
              fontFamily: 'monospace',
              width: '90%',
              lineHeight: '1.5rem',
              lineClamp: '2rem',
              marginTop: '0',
              marginBottom: '5rem',
              letterSpacing: '0',
            }}
          >
            {values.description}
          </p>
        </div>
      ),
      {
        ...size,
        fonts: [
          {
            name: 'geistsans',
            data: geistsansData,
          },
          {
            name: 'monospace',
            data: monospaceData,
          },
        ],
      }
    )
  } catch (error) {
    console.error(error)
    return new Response(`Failed to generate image`, {
      status: 500,
    })
  }
}
