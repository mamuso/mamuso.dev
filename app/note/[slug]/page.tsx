import { BLOG_TITLE } from '@/lib/constants'
import { Metadata } from 'next'
import { getAllPosts, getPostBySlug, hasPostSlug } from '@/lib/api'
import Post from '@/app/components/Post'
import { notFound } from 'next/navigation'
import { createPageMetadata } from '@/lib/metadata'

type PageProps = { params: Promise<{ slug: string }> }

// Pre-generate all post pages at build time
export async function generateStaticParams() {
  const posts = getAllPosts(['slug'])
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  if (!hasPostSlug(slug)) notFound()

  const post = getPostBySlug(slug, ['title', 'date', 'slug', 'summary'])

  return createPageMetadata({
    title: `${post.title || 'Notes'} – ${BLOG_TITLE}`,
    description: post.summary,
    path: `/note/${post.slug}`,
    ogSlug: post.slug,
  })
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params
  if (!hasPostSlug(slug)) notFound()

  const post = getPostBySlug(slug, ['title', 'date', 'slug', 'content', 'summary', 'category', 'basename', 'camera', 'iso', 'fnumber', 'exposureBiasValue', 'exposureTime', 'GPSLatitude', 'GPSLongitude', 'width', 'height', 'colorPalette'])
  return <Post post={post} priority={true} />
}
