import { NextRequest } from 'next/server'
import { ImageResponse } from '@vercel/og'

const monasans = fetch(new URL('../../public/fonts/mona-sans-black.ttf', import.meta.url)).then((res) => res.arrayBuffer())
const monospace = fetch(new URL('../../public/fonts/firacode-regular.ttf', import.meta.url)).then((res) => res.arrayBuffer())

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const monasansData = await monasans
    const monospaceData = await monospace

    const { searchParams } = req.nextUrl
    const values = {
      title: searchParams.get('title') || 'Why did you not set a title?',
      description: searchParams.get('description') || '',
    }

    values.title = values.title.length > 100 ? values.title.slice(0, 100) + '...' : values.title

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(http://localhost:3000/images/og-template.png)`,
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
              fontFamily: 'monasans',
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
          {/* 
          <div
            style={{
              maxWidth: '80%',
              height: '2.5rem',
              backgroundColor: '#133c7f',
              color: '#fff',
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              borderRadius: '0.35rem',
            }}
          >
            <span key="space" style={{ width: '1rem', whiteSpace: 'nowrap' }}>
              {' '}
            </span>
            <span key="space-2" style={{ width: '1rem', whiteSpace: 'nowrap' }}>
              {' '}
            </span>
          </div> */}
        </div>
      ),
      {
        width: 1200,
        height: 600,
        fonts: [
          {
            name: 'monasans',
            data: monasansData,
          },
          {
            name: 'monospace',
            data: monospaceData,
          },
        ],
      }
    )
  } catch (error) {
    return new Response(`Failed to generate image`, {
      status: 500,
    })
  }
}
