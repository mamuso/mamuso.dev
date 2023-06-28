import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '@/lib/constants'
import { getAllPosts } from '@/lib/api'
import { Post } from '@/lib/types'
import Pagination from '@/app/components/Pagination'
import HomePost from '@/app/components/HomePost'

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
        url: `${BLOG_URL}/images/og.png`,
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
  icons: {
    icon: {
      url: '/images/favicon.png',
      type: 'image/png',
    },
    shortcut: { url: '/images/favicon.png', type: 'image/png' },
  },
}

const postsPerPage: number = 20
const allPosts: Post[] = getAllPosts(['title', 'date', 'slug', 'image', 'content', 'category'])

function fetchData(page: number) {
  let pagePosts = allPosts.slice((page - 1) * postsPerPage, page * postsPerPage)
  const totalPages = Math.ceil(allPosts.length / postsPerPage)
  return {
    pagePosts: pagePosts,
    totalPages: totalPages,
    page: page,
  }
}

export default function Posts({ params }: { params: { page: number } }) {
  const page: number = params.page
  const props = fetchData(page)
  return (
    <>
      {props.pagePosts.map((post, i) => (
        <HomePost key={i} post={post} />
      ))}
      <Pagination page={page} totalPages={props.totalPages} />
    </>
  )
}
