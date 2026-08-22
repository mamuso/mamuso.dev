import { BLOG_TITLE, BLOG_SUBTITLE } from '@/lib/constants'
import { getAllPosts, getPostBySlug } from '@/lib/api'
import Post from '@/app/components/Post'
import Pagination from '@/app/components/Pagination'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createPageMetadata } from '@/lib/metadata'

const POSTS_PER_PAGE = 20
type PageProps = { params: Promise<{ page: string }> }

function getPageNumber(value: string, totalPages: number): number {
  if (!/^\d+$/.test(value)) notFound()

  const page = Number(value)
  if (!Number.isSafeInteger(page) || page < 1 || page > totalPages) notFound()

  return page
}

export async function generateStaticParams() {
  const allPosts = getAllPosts(['slug'])
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE)
  return Array.from({ length: totalPages }, (_, i) => ({ page: String(i + 1) }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const allPostsMinimal = getAllPosts(['slug', 'date'])
  const totalPages = Math.ceil(allPostsMinimal.length / POSTS_PER_PAGE)
  const { page: pageParam } = await params
  const page = getPageNumber(pageParam, totalPages)

  return createPageMetadata({
    title: `Notes, page ${page} – ${BLOG_TITLE}`,
    description: BLOG_SUBTITLE,
    path: `/notes/${page}`,
    ogSlug: 'notes',
  })
}

export default async function Posts({ params }: PageProps) {
  const allPostsMinimal = getAllPosts(['slug', 'date'])
  const totalPages = Math.ceil(allPostsMinimal.length / POSTS_PER_PAGE)
  const { page: pageParam } = await params
  const page = getPageNumber(pageParam, totalPages)

  const pagePostSlugs = allPostsMinimal.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)

  const pagePosts = pagePostSlugs.map((post) =>
    getPostBySlug(post.slug, ['title', 'date', 'slug', 'content', 'summary', 'category', 'basename', 'camera', 'iso', 'fnumber', 'exposureBiasValue', 'exposureTime', 'GPSLatitude', 'GPSLongitude', 'width', 'height', 'colorPalette'])
  )

  return (
    <>
      {pagePosts.map((post) => (
        <div key={post.slug}>
          <Post post={post} link={true} />
          <hr />
        </div>
      ))}
      <Pagination page={page} totalPages={totalPages} />
    </>
  )
}
