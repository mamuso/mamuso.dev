import { BLOG_TITLE, BLOG_SUBTITLE, getPostYear } from '@/lib/constants'
import { getAllPosts } from '@/lib/api'
import { PostType } from '@/lib/types'
import PostHome from '@/app/components/PostHome'
import Link from 'next/link'
import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata({
  title: `Notes – ${BLOG_TITLE}`,
  description: BLOG_SUBTITLE,
  path: '/notes',
  ogSlug: 'notes',
})

const allPosts: PostType[] = getAllPosts(['title', 'date', 'slug', 'category'])

export default function Posts() {
  const postsByYear: { [key: number]: PostType[] } = allPosts.reduce((acc: { [key: number]: PostType[] }, post) => {
    const year = getPostYear(post.date)
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(post)
    return acc
  }, {} as { [key: number]: PostType[] })

  return (
    <section>
      <header>
        <h2>Journal</h2>
        <p>
          <Link href="/notes/1">Expand all notes ↓</Link>
        </p>
      </header>
      {Object.entries(postsByYear)
        .reverse()
        .map(([year, posts]) => (
          <div key={year}>
            <h3>{year}</h3>
            <ul>
              {posts.map((post) => (
                <li key={post.slug}>
                  <PostHome post={post} />
                </li>
              ))}
            </ul>
          </div>
        ))}
    </section>
  )
}
