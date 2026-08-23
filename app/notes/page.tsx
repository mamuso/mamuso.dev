import { BLOG_TITLE, BLOG_SUBTITLE, getPostYear } from '@/lib/constants'
import { getAllPosts } from '@/lib/api'
import type { Post } from '@/lib/types'
import PostHome from '@/app/components/PostHome'
import Link from 'next/link'
import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata({
  title: `Notes – ${BLOG_TITLE}`,
  description: BLOG_SUBTITLE,
  path: '/notes',
  ogSlug: 'notes',
})

// Content is immutable within a deployment, so production can retain the
// generated route indefinitely. Development still renders from disk per request.
export const revalidate = false

type NoteListPost = Pick<Post, 'title' | 'date' | 'slug' | 'category'>

export default function Posts() {
  const allPosts = getAllPosts(['title', 'date', 'slug', 'category'])
  const postsByYear = allPosts.reduce<Record<number, NoteListPost[]>>((acc, post) => {
    const year = getPostYear(post.date)
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(post)
    return acc
  }, {})

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
