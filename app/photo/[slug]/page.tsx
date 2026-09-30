import { pageMetadata, photoSocialImage } from '@/lib/metadata'
import { BLOG_TITLE } from '@/lib/constants'
import { Metadata } from 'next'
import { getPostRouteSlugs, getPostBySlug, resolvePostSlug } from '@/lib/api'
import { notFound, permanentRedirect } from 'next/navigation'
import { POST_DETAIL_FIELDS } from '@/lib/types'
import { postPath } from '@/lib/post-path'
import Post from '@/app/components/Post'

// Pre-generate every route slug, as /note does: aliases and notes prerender as
// redirects, which a dynamic render would otherwise send with a doubled Location.
export async function generateStaticParams() {
  return (await getPostRouteSlugs()).map((slug) => ({ slug }))
}

/** Aliases and written notes redirect to their canonical path. */
async function canonicalSlug(slug: string): Promise<string> {
  const resolved = await resolvePostSlug(slug)
  if (!resolved) notFound()
  const { category } = await getPostBySlug(resolved, ['category'])
  const path = postPath({ slug: resolved, category })
  if (path !== `/photo/${slug}`) permanentRedirect(path)
  return resolved
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params
  const post = await getPostBySlug(await canonicalSlug(params.slug), ['title', 'slug', 'summary'])
  return pageMetadata({
    title: `${post.title} – ${BLOG_TITLE}`,
    path: `/photo/${post.slug}`,
    description: post.summary || `${post.title} — Photography by Mamuso.`,
    image: photoSocialImage(post.slug, post.title),
  })
}

export default async function PhotoPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const post = await getPostBySlug(await canonicalSlug(params.slug), POST_DETAIL_FIELDS)
  return <Post post={post} priority={true} />
}
