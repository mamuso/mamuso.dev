import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '../../../lib/constants'
import { getAllPosts } from '../../../lib/api'
import { Post } from '../../../lib/types'

export const metadata = {
  title: `${BLOG_TITLE} – ${BLOG_SUBTITLE}`,
  description: BLOG_SUBTITLE,
  canonical: `${BLOG_URL}`,
  openGraph: {
    url: `${BLOG_URL}`,
    title: `${BLOG_TITLE}`,
    description: `${BLOG_SUBTITLE}`,
    images: [
      {
        url: `${BLOG_URL}/image/og.png`,
        width: 1200,
        height: 627,
        alt: `${BLOG_TITLE} – ${BLOG_SUBTITLE}`,
      },
    ],
    site_name: `${BLOG_TITLE}`,
  },
  twitter: {
    handle: '@mamuso',
    site: '@mamuso',
    cardType: 'summary_large_image',
  },
}

const postsPerPage: number = 20
const allPosts: Post[] = getAllPosts(['title', 'date', 'slug', 'image', 'content'])

export default function Posts({ params }: { params: { page: number } }) {
  const props = fetchData(params)
  return <>dddddd</>
}

function fetchData(params: { page: number }) {
  const page: number = params.page
  let pagePosts = allPosts.slice((page - 1) * postsPerPage, page * postsPerPage)
  const totalPages = Math.ceil(allPosts.length / postsPerPage)
  return {
    pagePosts: pagePosts,
    totalPages: totalPages,
    page: page,
  }
}
