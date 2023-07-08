import { BLOG_URL } from '@/lib/constants'
import { PostType } from '@/lib/types'
import Link from 'next/link'
import Image from 'next/image'
import Markdown from 'markdown-to-jsx'
import { SelectIcon } from './Icons'
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
        {/* <SelectIcon category={post.category} />
        {post.category}
        {' · '} */}
        <time dateTime={post.date}>{new Date(`${post.date}T00:00:00`).toLocaleDateString('en-us', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</time>
      </section>
      <section className="post-content">
        {post.basename && <Image src={`/assets/feed/${post.basename}`} sizes="(max-width: 1600px) 100vw" width={post.width} height={post.height} alt={post.title} className="photo-highlight" />}
        {post.category === 'photo' && <PhotoMeta post={post} />}
        <Markdown>{post.content}</Markdown>
      </section>
    </article>
  )
}
