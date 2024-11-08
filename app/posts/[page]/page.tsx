import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '@/lib/constants'
import { getAllPosts } from '@/lib/api'
import { PostType } from '@/lib/types'
import Post from '@/app/components/Post'
import Pagination from '@/app/components/Pagination'
import PhotoGallery from '@/app/components/PhotoGallery'

export const metadata = {
  title: `Posts – ${BLOG_TITLE}`,
  description: BLOG_SUBTITLE,
  canonical: `${BLOG_URL}`,
  openGraph: {
    url: `${BLOG_URL}`,
    title: `Posts – ${BLOG_TITLE}`,
    description: `${BLOG_SUBTITLE}`,
    images: [
      {
        url: `${BLOG_URL}/og/Posts/${BLOG_TITLE}/opengraph-image`,
        width: 1200,
        height: 600,
        alt: `Posts – ${BLOG_TITLE}`,
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

const postsPerPage: number = 20
const allPosts: PostType[] = getAllPosts(['title', 'date', 'slug', 'content', 'summary', 'category', 'basename', 'camera', 'iso', 'fnumber', 'exposureBiasValue', 'exposureTime', 'GPSLatitude', 'GPSLongitude', 'width', 'height', 'colorPalette'])

function fetchData(page: number) {
  let pagePosts = allPosts.slice((page - 1) * postsPerPage, page * postsPerPage)
  const totalPages = Math.ceil(allPosts.length / postsPerPage)
  return {
    pagePosts: pagePosts,
    totalPages: totalPages,
    page: page,
  }
}

export default async function Posts(props0: { params: Promise<{ page: number }> }) {
  const params = await props0.params;
  const page: number = params.page
  const props = fetchData(page)
  return (
    <>
      {props.pagePosts.map((post, i) => (
        <div className="post-item" key={i}>
          <Post key={i} post={post} link={true} />
          <hr />
        </div>
      ))}
      <Pagination page={page} totalPages={props.totalPages} />
      <PhotoGallery />
    </>
  )
}
