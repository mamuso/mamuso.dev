import { BLOG_TITLE } from '@/lib/constants'
import { Metadata, ResolvingMetadata } from 'next'
import { getPostBySlug } from '@/lib/api'
import { PostType } from '@/lib/types'
import Post from '@/app/components/Post'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
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
  }
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post: PostType = getPostBySlug(params.slug, ['title', 'date', 'slug', 'content', 'summary', 'category', 'basename', 'camera', 'iso', 'fnumber', 'exposureBiasValue', 'exposureTime', 'GPSLatitude', 'GPSLongitude', 'width', 'height', 'colorPalette'])

  return <Post post={post} />
}
