import { BLOG_SUBTITLE, BLOG_TITLE } from '@/lib/constants'
import { getPostBySlug, hasPostSlug } from '@/lib/api'
import { ImageResponse } from 'next/og'
import { notFound } from 'next/navigation'

export const contentType = 'image/png'
export const size = {
  width: 1200,
  height: 600,
}

const pageContent = new Map([
  ['home', { title: BLOG_TITLE, description: BLOG_SUBTITLE }],
  ['notes', { title: 'Notes', description: BLOG_TITLE }],
  ['photos', { title: 'Photos', description: 'Mamuso has a camera' }],
])

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let content = pageContent.get(slug)

  if (!content) {
    if (!hasPostSlug(slug)) notFound()

    const post = getPostBySlug(slug, ['title', 'date'])
    content = {
      title: post.title || 'Notes',
      description: new Date(`${post.date}T00:00:00`).toLocaleDateString('en-us', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    }
  }

  const title = content.title.length > 100 ? `${content.title.slice(0, 100)}...` : content.title

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: 'url(https://mamuso.dev/images/og-template.png)',
          backgroundSize: 'cover',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <h2
          style={{
            color: '#363636',
            fontSize: '7rem',
            lineHeight: '8rem',
            letterSpacing: '-0.1rem',
            width: '90%',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            color: '#808080',
            fontSize: '2rem',
            width: '90%',
            lineHeight: '1.5rem',
            lineClamp: '2rem',
            marginTop: '0',
            marginBottom: '5rem',
            letterSpacing: '0',
          }}
        >
          {content.description}
        </p>
      </div>
    ),
    size
  )
}
