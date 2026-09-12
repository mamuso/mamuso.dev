import { pageMetadata, photoSocialImage } from '@/lib/metadata'
import { BLOG_TITLE } from '@/lib/constants'
import { Metadata } from 'next'
import { getPostRouteSlugs, getPostBySlug, resolvePostSlug } from '@/lib/api'
import { notFound, permanentRedirect } from 'next/navigation'
import { POST_DETAIL_FIELDS } from '@/lib/types'
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
  const params = await props.params
  const post = getPostBySlug(canonicalSlug(params.slug), ['title', 'slug', 'summary', 'category', 'basename'])
  return pageMetadata({
    title: `${post.title || 'Notes'} – ${BLOG_TITLE}`,
    path: `/note/${post.slug}`,
    description: post.summary || (post.category === 'photo' ? `${post.title} — Photography by Mamuso.` : undefined),
    image: post.category === 'photo' && post.basename ? photoSocialImage(post.basename, post.title) : undefined,
  })
}

export default async function PostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const post = getPostBySlug(canonicalSlug(params.slug), POST_DETAIL_FIELDS)
  return <Post post={post} priority={true} />
}
