import { NextRequest } from 'next/server'
import { ImageResponse } from '@vercel/og'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    // const fontRegular = await montserratRegular
    // const fontBold = await montserratExtraBold

    const { searchParams } = req.nextUrl
    const values = {
      title: searchParams.get('title') || 'Hello World',
      description: searchParams.get('description') || '',
      url: searchParams.get('url') || '',
    }

    values.title = values.title.length > 100 ? values.title.slice(0, 100) + '...' : values.title

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `linear-gradient(45deg, #0b1120, #0d3256)`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
          <h2
            key="title"
            style={{
              color: 'white',
              fontSize: '3rem',
              fontFamily: 'font',
              fontWeight: '800',
              width: '80%',
            }}
          >
            {values.title}
          </h2>
          <p
            key="description"
            style={{
              color: '#ccc',
              fontSize: '1rem',
              fontFamily: 'font',
              fontWeight: '400',
              width: '80%',
              lineHeight: '1.5rem',
              lineClamp: '2rem',
            }}
          >
            {values.description}
          </p>
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
            <span key="link" style={{ fontSize: '1rem' }}>
              {process.env.NEXT_PUBLIC_URL}/{values.url}
            </span>
            <span key="space-2" style={{ width: '1rem', whiteSpace: 'nowrap' }}>
              {' '}
            </span>
          </div>
        </div>
      ),
      {
        width: 800,
        height: 450,
        // fonts: [
        // {
        // 	name: "font",
        // 	data: fontRegular,
        // 	weight: 400,
        // 	style: "normal",
        // },
        // {
        // 	name: "font",
        // 	data: fontBold,
        // 	weight: 700,
        // 	style: "normal",
        // },
        // ],
      }
    )
  } catch (error) {
    return new Response(`Failed to generate image`, {
      status: 500,
    })
  }
}
