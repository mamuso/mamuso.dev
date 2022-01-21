// import fs from 'fs'
import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '../../lib/constants'
import { getAllPosts } from '../../lib/api'
// import { generateRss } from '../../lib/rss'

import { NextSeo } from 'next-seo'
import Head from 'next/head'
import Post from '../../components/Post'
import Pagination from '../../components/Pagination'

const postsPerPage = 20
const allPosts = getAllPosts(['title', 'date', 'slug', 'image', 'content'])

export default function Index({ pagePosts, totalPages, page }) {
  if (pagePosts) {
    return (
      <>
        <NextSeo
          title={BLOG_SUBTITLE}
          description={BLOG_SUBTITLE}
          canonical={BLOG_URL}
          openGraph={{
            url: `${BLOG_URL}`,
            title: `${BLOG_TITLE}`,
            description: `${BLOG_SUBTITLE}`,
            images: [
              {
                url: `${BLOG_URL}/img/og.png`,
                width: 1200,
                height: 627,
                alt: `${BLOG_TITLE} – ${BLOG_SUBTITLE}`,
              },
            ],
            site_name: `${BLOG_TITLE}`,
          }}
          twitter={{
            handle: '@mamuso',
            site: '@mamuso',
            cardType: 'summary_large_image',
          }}
        />
        <Head>
          <title>{`${BLOG_TITLE} – ${BLOG_SUBTITLE}`}</title>
        </Head>
        {pagePosts.map((post) => (
          <Post post={{ link: true, ...post }} key={post.date} />
        ))}
        <Pagination page={page} totalPages={totalPages} />
      </>
    )
  } else {
    return null
  }
}

export async function getStaticPaths() {
  // calculate the number of pages to spit the static paths
  const totalPages = Math.ceil(allPosts.length / postsPerPage)
  const pathPages = Array.from({ length: totalPages }, (x, i) => ({
    params: {
      page: `${i + 1}`,
    },
  }))
  return {
    paths: pathPages,
    fallback: true,
  }
}

export async function getStaticProps(context) {
  const { page } = context.params
  let pagePosts = allPosts.slice((page - 1) * postsPerPage, page * postsPerPage)
  const totalPages = Math.ceil(allPosts.length / postsPerPage)

  // const rss = await generateRss(allPosts)
  // fs.writeFileSync('./public/rss.xml', rss)

  return {
    props: { pagePosts: pagePosts, totalPages: totalPages, page: page },
  }
}
