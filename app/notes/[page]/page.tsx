import { POST_DETAIL_FIELDS } from '@/lib/types'
import { pageMetadata } from '@/lib/metadata'
import { BLOG_TITLE } from '@/lib/constants'
import { getNotePosts, getPostBySlug } from '@/lib/api'
import { notFound } from 'next/navigation'
import Post from '@/app/components/Post'
import Pagination from '@/app/components/Pagination'
import * as stylex from '@stylexjs/stylex'
import { layout } from '@/app/styles/site'
import { colors } from '../../styles/tokens.stylex'

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params
  return pageMetadata({ title: `Notes – Page ${Number(page)} – ${BLOG_TITLE}`, path: `/notes/${Number(page)}` })
}

const POSTS_PER_PAGE = 20

export async function generateStaticParams() {
  const allPosts = getNotePosts(['slug'])
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE)
  return Array.from({ length: totalPages }, (_, i) => ({ page: String(i + 1) }))
}

export default async function Posts(props: { params: Promise<{ page: string }> }) {
  const params = await props.params
  const page = Number(params.page)

  const allPostsMinimal = getNotePosts(['slug', 'date'])
  const totalPages = Math.ceil(allPostsMinimal.length / POSTS_PER_PAGE)

  if (!Number.isInteger(page) || page < 1 || page > totalPages) {
    notFound()
  }

  const pagePostSlugs = allPostsMinimal.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)

  const pagePosts = pagePostSlugs.map((post) =>
    getPostBySlug(post.slug, POST_DETAIL_FIELDS)
  )

  return (
    <section {...stylex.props(layout.section)}>
      {pagePosts.map((post) => (
        <div key={post.slug}>
          <Post post={post} link={true} />
          <hr {...stylex.props(styles.rule)} />
        </div>
      ))}
      <Pagination page={page} totalPages={totalPages} />
    </section>
  )
}

const styles = stylex.create({
  rule: {
    borderBlockEndWidth: 0,
    borderBlockStartColor: colors.ruleSoft,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: 1,
    borderInlineWidth: 0,
    marginBlock: 48,
  },
})
