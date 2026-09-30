import { pageMetadata, noteSocialImage } from '@/lib/metadata'
import { BLOG_TITLE } from '@/lib/constants'
import { Metadata } from 'next'
import { getPostRouteSlugs, getPostBySlug, resolvePostSlug } from '@/lib/api'
import { notFound, permanentRedirect } from 'next/navigation'
import { POST_DETAIL_FIELDS } from '@/lib/types'
import { postPath } from '@/lib/post-path'
import Post from '@/app/components/Post'

// Pre-generate all post pages at build time; photos and aliases prerender as redirects.
export async function generateStaticParams() {
  return (await getPostRouteSlugs()).map((slug) => ({ slug }))
}

/** Aliases redirect to the canonical slug, and photos to /photo/<slug>. */
async function canonicalSlug(slug: string): Promise<string> {
  const resolved = await resolvePostSlug(slug)
  if (!resolved) notFound()
  const { category } = await getPostBySlug(resolved, ['category'])
  const path = postPath({ slug: resolved, category })
  if (path !== `/note/${slug}`) permanentRedirect(path)
  return resolved
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params
  const post = await getPostBySlug(await canonicalSlug(params.slug), ['title', 'slug', 'summary'])
  return pageMetadata({
    title: `${post.title || 'Notes'} – ${BLOG_TITLE}`,
    path: `/note/${post.slug}`,
    description: post.summary,
    image: noteSocialImage(post.slug, post.title || 'Notes'),
  })
}

export default async function PostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const post = await getPostBySlug(await canonicalSlug(params.slug), POST_DETAIL_FIELDS)
  return <Post post={post} priority={true} />
}
