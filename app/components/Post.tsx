import { PostType } from '@/lib/types'
import { formatPostDate } from '@/lib/constants'
import Link from 'next/link'
import Image from 'next/image'
import Markdown from 'markdown-to-jsx'
import PhotoMeta from './PhotoMeta'

export default function Post({ post, link = false, priority = false }: { post: PostType; link?: boolean; priority?: boolean }) {
  return (
    <article className="post">
      {link && (
        <h2>
          <Link href={`/post/${post.slug}`}>{post.title}</Link>
        </h2>
      )}
      {!link && <h2>{post.title}</h2>}
      <section className="post-meta mono">
        <time dateTime={post.date}>{formatPostDate(post.date, true)}</time>
      </section>
      {post.basename && (
        <div className="photo-highlight">
          <Image src={`/assets/feed/${post.basename}`} sizes="(min-width: 1040px) 874px, (min-width: 900px) 807px, calc(94.31vw - 23px)" width={post.width / 3} height={post.height / 3} alt={post.title} priority={priority} />
        </div>
      )}
      <section className="post-content">
        {post.category === 'photo' && <PhotoMeta post={post} />}
        <Markdown>{post.content}</Markdown>
      </section>
    </article>
  )
}
