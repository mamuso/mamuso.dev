import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const size = {
  width: 1200,
  height: 600,
}
export async function textSocialImage(title: string, description: string) {
  try {
    const template = await readFile(path.join(process.cwd(), 'public/images/og-template.png'))
    const background = `data:image/png;base64,${template.toString('base64')}`
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
      size
    )
  } catch (error) {
    console.error(error)
    return new Response(`Failed to generate image`, {
      status: 500,
    })
  }
}
