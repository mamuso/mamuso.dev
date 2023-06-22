import { BLOG_TITLE } from '@/lib/constants'
import { Metadata, ResolvingMetadata } from 'next'
import { getPostBySlug } from '@/lib/api'
import { Post } from '@/lib/types'
import DetailPost from '@/app/components/DetailPost'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post: Post = getPostBySlug(params.slug, ['title', 'date', 'slug', 'image', 'summary', 'content', 'category'])

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

export default function Post({ params }: { params: { slug: string } }) {
  const post: Post = getPostBySlug(params.slug, ['title', 'date', 'slug', 'image', 'content', 'category'])

  return <DetailPost post={post} />
}
