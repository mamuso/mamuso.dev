import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '@/lib/constants'
import { getAllPosts, getPostBySlug } from '@/lib/api'
import { PostType } from '@/lib/types'
import Post from '@/app/components/Post'
import Pagination from '@/app/components/Pagination'
import PhotoGallery from '@/app/components/PhotoGallery'

export const metadata = {
  title: `Notes – ${BLOG_TITLE}`,
  description: BLOG_SUBTITLE,
  canonical: `${BLOG_URL}`,
  openGraph: {
    url: `${BLOG_URL}`,
    title: `Notes – ${BLOG_TITLE}`,
    description: `${BLOG_SUBTITLE}`,
    images: [
      {
        url: `${BLOG_URL}/og/Notes/${BLOG_TITLE}/opengraph-image`,
        width: 1200,
        height: 600,
        alt: `Notes – ${BLOG_TITLE}`,
      },
    ],
    site_name: `${BLOG_TITLE}`,
  },
  twitter: {
    handle: '@mamuso',
    site: '@mamuso',
    cardType: 'summary_large_image',
  },
  icons: {
    icon: {
      url: '/images/favicon.png',
      type: 'image/png',
    },
    shortcut: { url: '/images/favicon.png', type: 'image/png' },
  },
}

const POSTS_PER_PAGE = 20

// Pre-generate all pagination pages at build time
export async function generateStaticParams() {
  const allPosts = getAllPosts(['slug'])
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE)
  return Array.from({ length: totalPages }, (_, i) => ({ page: String(i + 1) }))
}

export default async function Posts(props: { params: Promise<{ page: number }> }) {
  const params = await props.params;
  const page: number = params.page

  // First, get minimal data for all posts (only slug and date for sorting/pagination)
  const allPostsMinimal = getAllPosts(['slug', 'date'])
  const totalPages = Math.ceil(allPostsMinimal.length / POSTS_PER_PAGE)

  // Get slugs for the current page only
  const pagePostSlugs = allPostsMinimal.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)

  // Then, only load full data for posts on the current page
  const pagePosts = pagePostSlugs.map((post) =>
    getPostBySlug(post.slug, ['title', 'date', 'slug', 'content', 'summary', 'category', 'basename', 'camera', 'iso', 'fnumber', 'exposureBiasValue', 'exposureTime', 'GPSLatitude', 'GPSLongitude', 'width', 'height', 'colorPalette'])
  )

  return (
    <>
      {pagePosts.map((post) => (
        <div className="post-item" key={post.slug}>
          <Post post={post} link={true} />
          <hr />
        </div>
      ))}
      <Pagination page={page} totalPages={totalPages} />
      <PhotoGallery />
    </>
  )
}
