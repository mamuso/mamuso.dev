import { PostType } from '@/lib/types'
import Link from 'next/link'
import Image from 'next/image'
import Markdown from 'markdown-to-jsx'
import PhotoMeta from './PhotoMeta'

export default function Post({ post, link = false }: { post: PostType; link?: boolean }) {
  return (
    <article className="post">
      {link && (
        <h2>
          <Link href={`/post/${post.slug}`}>{post.title}</Link>
        </h2>
      )}
      {!link && <h2>{post.title}</h2>}
      <section className="post-meta mono">
        <time dateTime={post.date}>{new Date(`${post.date}T00:00:00`).toLocaleDateString('en-us', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</time>
      </section>
      {post.basename && (
        <div className="photo-highlight">
          <Image src={`/assets/feed/${post.basename}`} sizes="(min-width: 1040px) 874px, (min-width: 900px) 807px, calc(94.31vw - 23px)" width={post.width / 3} height={post.height / 3} alt={post.title} loading="eager" />
        </div>
      )}
      <section className="post-content">
        {post.category === 'photo' && <PhotoMeta post={post} />}
        <Markdown>{post.content}</Markdown>
      </section>
    </article>
  )
}
