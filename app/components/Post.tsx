import { PostDetail } from '@/lib/types'
import { formatPostDate } from '@/lib/editorial-date'
import Link from 'next/link'
import Image from 'next/image'
import Markdown from 'markdown-to-jsx'
import PhotoMeta from './PhotoMeta'
import PhotoDetail from './PhotoDetail'
import PhotoTransition from './PhotoTransition'
import ProgressivePhoto from './ProgressivePhoto'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '../styles/site'

export default function Post({ post, link = false, priority = false }: { post: PostDetail; link?: boolean; priority?: boolean }) {
  if (post.category === 'photo' && !link) {
    return (
      <PhotoDetail title={post.title} photos={[post]}>
        <div {...stylex.props(styles.content)}>
          <Markdown options={{ overrides: markdownOverrides }} {...stylex.props(styles.markdown)}>{post.content}</Markdown>
        </div>
      </PhotoDetail>
    )
  }

  return (
    <article {...stylex.props(layout.section, styles.article)}>
      {link ? (
        <h2 {...stylex.props(typography.heading)}>
          <Link href={`/note/${post.slug}`} {...stylex.props(typography.link)}>{post.title}</Link>
        </h2>
      ) : (
        <h2 {...stylex.props(typography.heading)}>{post.title}</h2>
      )}
      <p {...stylex.props(typography.muted, styles.copy)}>
        <time dateTime={post.date}>{formatPostDate(post.date, true)}</time>
      </p>
      {post.basename && (
        <p {...stylex.props(styles.copy)}>
          <PhotoTransition slug={post.category === 'photo' ? post.slug : undefined}>
            {post.category === 'photo' ? (
              <ProgressivePhoto basename={post.basename} width={post.width} height={post.height} title={post.title}
                eager={priority} sizes="(max-width: 639px) calc(100vw - 58px), (max-width: 1079px) calc(100vw - 132px), 948px"
                {...stylex.props(styles.image, styles.photoSize(post.width))} />
            ) : (
              <Image src={`/assets/feed/${post.basename}`} width={post.width / 3} height={post.height / 3}
                alt={post.title || 'This picture is missing a title'} loading={priority ? 'eager' : 'lazy'} {...stylex.props(styles.image)} />
            )}
          </PhotoTransition>
        </p>
      )}
      <div {...stylex.props(styles.content)}>
        {post.category === 'photo' && <PhotoMeta post={post} />}
        <Markdown options={{ overrides: markdownOverrides }} {...stylex.props(styles.markdown)}>{post.content}</Markdown>
      </div>
    </article>
  )
}

const styles = stylex.create({
  article: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  copy: {
    marginBlock: 0,
  },
  image: {
    display: 'block',
    height: 'auto',
    maxWidth: '100%',
  },
  photoSize: (width: number) => ({ width }),
  content: {
    marginBlockStart: 16,
    minWidth: 0,
  },
  markdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  markdownBlock: {
    marginBlock: 0,
  },
  markdownList: {
    marginBlock: 0,
    paddingInlineStart: 20,
  },
  blockquote: {
    borderInlineStartColor: '#a1a1aa',
    borderInlineStartStyle: 'solid',
    borderInlineStartWidth: 1,
    marginBlock: 0,
    marginInline: 0,
    paddingInlineStart: 16,
  },
  codeBlock: {
    maxWidth: '100%',
    overflowX: 'auto',
  },
})

const headingProps = stylex.props(typography.heading, styles.markdownBlock)
const markdownOverrides = {
  h1: { props: headingProps },
  h2: { props: headingProps },
  h3: { props: headingProps },
  h4: { props: headingProps },
  h5: { props: headingProps },
  h6: { props: headingProps },
  p: { props: stylex.props(styles.markdownBlock) },
  ul: { props: stylex.props(styles.markdownList) },
  ol: { props: stylex.props(styles.markdownList) },
  a: { props: stylex.props(typography.link) },
  blockquote: { props: stylex.props(typography.muted, styles.blockquote) },
  pre: { props: stylex.props(styles.markdownBlock, styles.codeBlock) },
}
