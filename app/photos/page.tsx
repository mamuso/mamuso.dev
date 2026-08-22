import { BLOG_TITLE } from '@/lib/constants'
import { getPhotoPosts } from '@/lib/api'
import { PostType } from '@/lib/types'
import Link from 'next/link'
import Image from 'next/image'
import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata({
  title: `Photos – ${BLOG_TITLE}`,
  description: 'Mamuso has a camera',
  path: '/photos',
  ogSlug: 'photos',
})

export default function Photos() {
  const photoPosts: PostType[] = getPhotoPosts(['title', 'date', 'slug', 'category', 'basename', 'width', 'height'])
  return (
    <section>
      <h2>Say Cheese</h2>
      <ul>
        {photoPosts.map((post) => (
          <li key={post.slug}>
            <Link href={`/note/${post.slug}`}>
              <Image src={`/assets/feed/gallery-${post.basename}`} width={post.width / 4} height={post.height / 4} alt={post.title} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
