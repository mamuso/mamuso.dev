import { BLOG_TITLE, BLOG_URL } from '@/lib/constants'
import { Metadata, ResolvingMetadata } from 'next'
import { getPostBySlug } from '@/lib/api'
import { PostType } from '@/lib/types'
import Post from '@/app/components/Post'
import PhotoGallery from '@/app/components/PhotoGallery'

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const post: PostType = getPostBySlug(params.slug, ['title', 'date', 'slug', 'image', 'summary', 'content', 'category'])

  return {
    title: `${post.title ? post.title : 'Notes'} – ${BLOG_TITLE}`,
    description: post.summary,
    icons: {
      icon: {
        url: '/images/favicon.png',
        type: 'image/png',
      },
      shortcut: { url: '/images/favicon.png', type: 'image/png' },
    },
    openGraph: {
      url: `${BLOG_URL}`,
      title: `${post.title ? post.title : 'Notes'} – ${BLOG_TITLE}`,
      images: [
        {
          url: `${BLOG_URL}/og/${post.title ? post.title : 'Notes'}/${new Date(`${post.date}T00:00:00`).toLocaleDateString('en-us', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}/opengraph-image`,
          width: 1200,
          height: 600,
          alt: `${post.title} – ${new Date(`${post.date}T00:00:00`).toLocaleDateString('en-us', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}`,
        },
      ],
    },
  }
}

export default async function PostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const post: PostType = getPostBySlug(params.slug, ['title', 'date', 'slug', 'content', 'summary', 'category', 'basename', 'camera', 'iso', 'fnumber', 'exposureBiasValue', 'exposureTime', 'GPSLatitude', 'GPSLongitude', 'width', 'height', 'colorPalette'])
  return (
    <>
      <Post post={post} />
      <PhotoGallery />
    </>
  )
}
