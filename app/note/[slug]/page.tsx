import { BLOG_TITLE, BLOG_URL } from '@/lib/constants'
import { Metadata } from 'next'
import { getPostRouteSlugs, getPostBySlug, resolvePostSlug } from '@/lib/api'
import { notFound, permanentRedirect } from 'next/navigation'
import { PostType } from '@/lib/types'
import Post from '@/app/components/Post'

// Pre-generate all post pages at build time
export async function generateStaticParams() {
  return getPostRouteSlugs().map((slug) => ({ slug }))
}

function canonicalSlug(slug: string): string {
  const resolved = resolvePostSlug(slug)
  if (!resolved) notFound()
  if (resolved !== slug) permanentRedirect(`/note/${resolved}`)
  return resolved
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const post: PostType = getPostBySlug(canonicalSlug(params.slug), ['title', 'date', 'slug', 'image', 'summary', 'category'])

  return {
    title: `${post.title ? post.title : 'Notes'} – ${BLOG_TITLE}`,
    description: post.summary,
    alternates: { canonical: `${BLOG_URL}/note/${post.slug}` },
    icons: {
      icon: {
        url: '/images/favicon.png',
        type: 'image/png',
      },
      shortcut: { url: '/images/favicon.png', type: 'image/png' },
    },
    openGraph: {
      url: `${BLOG_URL}/note/${post.slug}`,
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
  const post: PostType = getPostBySlug(canonicalSlug(params.slug), ['title', 'date', 'slug', 'content', 'summary', 'category', 'basename', 'camera', 'iso', 'fnumber', 'exposureBiasValue', 'exposureTime', 'GPSLatitude', 'GPSLongitude', 'width', 'height', 'colorPalette'])
  return <Post post={post} priority={true} />
}
