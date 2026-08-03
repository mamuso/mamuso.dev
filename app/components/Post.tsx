import { PostType } from '@/lib/types'
import { formatPostDate } from '@/lib/constants'
import Link from 'next/link'
import Image from 'next/image'
import Markdown from 'markdown-to-jsx'
import PhotoMeta from './PhotoMeta'
import { markdownOverrides } from './MarkdownPhotoGallery'

export default function Post({ post, link = false, priority = false }: { post: PostType; link?: boolean; priority?: boolean }) {
  return (
    <article>
      {link ? (
        <h2>
          <Link href={`/note/${post.slug}`}>{post.title}</Link>
        </h2>
      ) : (
        <h2>{post.title}</h2>
      )}
      <p>
        <time dateTime={post.date}>{formatPostDate(post.date, true)}</time>
      </p>
      {post.basename && (
        <p>
          <Image src={`/assets/feed/${post.basename}`} width={post.width / 3} height={post.height / 3} alt={post.title || 'This picture is missing a title'} priority={priority} />
        </p>
      )}
      <div>
        {post.category === 'photo' && <PhotoMeta post={post} />}
        <Markdown options={{ overrides: markdownOverrides }}>{post.content}</Markdown>
      </div>
    </article>
  )
}
