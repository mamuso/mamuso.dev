import { PostDetail } from '@/lib/types'
import type { ComponentProps } from 'react'
import { formatPostDate, formatPostMonth } from '@/lib/editorial-date'
import Link from 'next/link'
import Image from 'next/image'
import Markdown from 'markdown-to-jsx'
import PhotoMeta from './PhotoMeta'
import PhotoDetail from './PhotoDetail'
import PhotoTransition from './PhotoTransition'
import ProgressivePhoto from './ProgressivePhoto'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '../styles/site'
import { colors } from '../styles/tokens.stylex'

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

  const isNoteDetail = !link && post.category !== 'photo'

  return (
    <article {...stylex.props(layout.section, styles.article, isNoteDetail && styles.note)}>
      {link ? (
        <h2 {...stylex.props(typography.heading)}>
          <Link href={`/note/${post.slug}`} {...stylex.props(typography.link)}>{post.title}</Link>
        </h2>
      ) : (
        <h1 {...stylex.props(typography.heading, styles.noteTitle)}>{post.title}</h1>
      )}
      <p {...stylex.props(typography.muted, styles.copy, isNoteDetail && styles.noteDate)}>
        <time dateTime={post.date}>{isNoteDetail ? formatPostMonth(post.date) : formatPostDate(post.date, true)}</time>
      </p>
      {post.basename && (
        <p {...stylex.props(styles.copy, isNoteDetail && styles.noteImage)}>
          <PhotoTransition slug={post.category === 'photo' ? post.slug : undefined}>
            {post.category === 'photo' ? (
              <ProgressivePhoto basename={post.basename} width={post.width} height={post.height} title={post.title}
                eager={priority} sizes="(max-width: 639px) calc(100vw - 58px), (max-width: 1079px) calc(100vw - 132px), 948px"
                {...stylex.props(styles.image, styles.photoSize(post.width))} />
            ) : (
              <Image src={`/assets/feed/${post.basename}`} width={post.width / 3} height={post.height / 3}
                alt={post.title ?? ''} loading={priority ? 'eager' : 'lazy'}
                sizes={isNoteDetail ? '(max-width: 639px) calc(100vw - 24px), (max-width: 1079px) calc(100vw - 120px), 960px' : undefined}
                {...stylex.props(styles.image, isNoteDetail && styles.wideMedia)} />
            )}
          </PhotoTransition>
        </p>
      )}
      <div {...stylex.props(styles.content, isNoteDetail && styles.noteContent)}>
        {post.category === 'photo' && <PhotoMeta post={post} />}
        {/* Repository-authored notes include raw HTML video embeds. */}
        <Markdown options={{ tagfilter: !isNoteDetail, overrides: isNoteDetail ? noteMarkdownOverrides : markdownOverrides }} {...stylex.props(styles.markdown, isNoteDetail && styles.noteMarkdown)}>{post.content}</Markdown>
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
  note: {
    width: '100%',
    maxWidth: 704,
    marginInline: 'auto',
    fontSize: 18,
    lineHeight: 1.6,
    overflowWrap: 'anywhere',
  },
  noteTitle: {
    fontSize: { default: 32, '@media (min-width: 640px)': 40 },
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '-0.025em',
    textWrap: 'balance',
  },
  noteDate: {
    fontSize: 14,
    lineHeight: 1.5,
    marginBlockStart: 4,
    marginBlockEnd: 24,
  },
  noteContent: {
    marginBlockStart: 0,
  },
  noteImage: {
    marginBlockEnd: 16,
  },
  wideMedia: {
    display: 'block',
    width: {
      default: 'min(960px, calc(100vw - 24px))',
      '@media (min-width: 640px)': 'min(960px, calc(100vw - 120px))',
    },
    maxWidth: 'none',
    marginInline: {
      default: 'calc((100% - min(960px, calc(100vw - 24px))) / 2)',
      '@media (min-width: 640px)': 'calc((100% - min(960px, calc(100vw - 120px))) / 2)',
    },
  },
  noteFigure: {
    marginBlock: 0,
    marginInline: 0,
  },
  noteVideo: {
    display: 'block',
    width: '100%',
    height: 'auto',
    aspectRatio: '16 / 9',
    borderWidth: 0,
  },
  noteMarkdown: {
    gap: 24,
  },
  noteHeading: {
    marginBlockStart: 16,
    marginBlockEnd: 0,
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '-0.015em',
    textWrap: 'balance',
  },
  noteHeadingLarge: { fontSize: 24 },
  noteHeadingMedium: { fontSize: 20 },
  noteHeadingSmall: { fontSize: 18 },
  noteLink: {
    textDecorationLine: 'underline',
    textDecorationColor: { default: colors.quote, ':hover': colors.textPrimary },
    textDecorationThickness: 1,
  },
  noteList: {
    paddingInlineStart: 26,
  },
  noteListItem: {
    marginBlock: 8,
  },
  noteQuote: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingInlineStart: 24,
  },
  noteRule: {
    borderWidth: 0,
    borderBlockStartWidth: 1,
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: colors.ruleSoft,
    marginBlock: 16,
    marginInline: 0,
    width: '100%',
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
    borderInlineStartColor: colors.quote,
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

function NoteVideo({ src, title, ...props }: ComponentProps<'iframe'>) {
  return (
    <iframe {...props} src={src?.replaceAll('&amp;', '&')} title={title || 'Embedded video'}
      {...stylex.props(styles.noteVideo, styles.wideMedia)} />
  )
}

const noteMarkdownOverrides = {
  ...markdownOverrides,
  h1: { props: stylex.props(typography.heading, styles.noteHeading, styles.noteHeadingLarge) },
  h2: { props: stylex.props(typography.heading, styles.noteHeading, styles.noteHeadingLarge) },
  h3: { props: stylex.props(typography.heading, styles.noteHeading, styles.noteHeadingMedium) },
  h4: { props: stylex.props(typography.heading, styles.noteHeading, styles.noteHeadingSmall) },
  h5: { props: stylex.props(typography.heading, styles.noteHeading, styles.noteHeadingSmall) },
  h6: { props: stylex.props(typography.heading, styles.noteHeading, styles.noteHeadingSmall) },
  a: { props: stylex.props(typography.link, styles.noteLink) },
  ul: { props: stylex.props(styles.markdownList, styles.noteList) },
  ol: { props: stylex.props(styles.markdownList, styles.noteList) },
  li: { props: stylex.props(styles.noteListItem) },
  blockquote: { props: stylex.props(typography.muted, styles.blockquote, styles.noteQuote) },
  hr: { props: stylex.props(styles.noteRule) },
  img: { props: stylex.props(styles.image, styles.wideMedia) },
  video: { props: stylex.props(styles.image, styles.wideMedia) },
  audio: { props: stylex.props(styles.wideMedia) },
  figure: { props: stylex.props(styles.noteFigure) },
  iframe: { component: NoteVideo },
}
