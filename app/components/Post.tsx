import { PostDetail } from '@/lib/types'
import { Children, cloneElement, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from 'react'
import { formatPostDate, formatPostMonth } from '@/lib/editorial-date'
import { postPath } from '@/lib/post-path'
import Link from 'next/link'
import Image from 'next/image'
import Markdown from 'markdown-to-jsx'
import PhotoMeta from './PhotoMeta'
import PhotoDetail from './PhotoDetail'
import PhotoTransition from './PhotoTransition'
import ProgressivePhoto from './ProgressivePhoto'
import CodeBlock from './CodeBlock'
import NoteTweet from './NoteTweet'
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
          <Link href={postPath(post)} {...stylex.props(typography.link)}>{post.title}</Link>
        </h2>
      ) : (
        <h1 {...stylex.props(typography.heading, styles.noteTitle)}>{post.title}</h1>
      )}
      <p {...stylex.props(typography.muted, styles.copy, isNoteDetail && styles.noteDate)}>
        <time dateTime={post.date}>{isNoteDetail ? formatPostMonth(post.date) : formatPostDate(post.date, true)}</time>
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
                alt={post.title ?? ''} loading={priority ? 'eager' : 'lazy'}
                sizes={isNoteDetail ? '(max-width: 639px) calc(100vw - 24px), (max-width: 1079px) calc(100vw - 120px), 960px' : undefined}
                {...stylex.props(styles.image, isNoteDetail && styles.wideMedia, isNoteDetail && styles.noteMedia)} />
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
    maxWidth: 664,
    marginInline: 'auto',
    paddingBlockEnd: 200,
    fontSize: 16,
    lineHeight: 1.75,
    gap: 4,
    overflowWrap: 'anywhere',
  },
  noteTitle: {
    fontSize: 24,
    fontWeight: 500,
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
    textWrap: 'balance',
  },
  noteDate: {
    fontSize: 16,
    lineHeight: 1.75,
    marginBlockStart: 0,
    marginBlockEnd: 36,
  },
  noteContent: {
    marginBlockStart: 0,
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
  noteCaption: {
    fontSize: 14,
    marginBlockStart: -12,
    textAlign: 'center',
    opacity: 0.6,
  },
  noteMedia: {
    borderRadius: 6,
    marginBlockEnd: 24,
  },
  galleryRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBlockEnd: 24,
  },
  galleryRow: {
    display: 'flex',
    flexDirection: { default: 'column', '@media (min-width: 640px)': 'row' },
    alignItems: 'flex-start',
    gap: 12,
  },
  galleryGrid: {
    display: 'grid',
    alignItems: 'start',
    gap: 12,
    marginBlockEnd: 24,
  },
  galleryCols2: { gridTemplateColumns: { default: '1fr', '@media (min-width: 640px)': 'repeat(2, 1fr)' } },
  galleryCols3: { gridTemplateColumns: { default: 'repeat(2, 1fr)', '@media (min-width: 640px)': 'repeat(3, 1fr)' } },
  galleryCols4: { gridTemplateColumns: { default: 'repeat(2, 1fr)', '@media (min-width: 640px)': 'repeat(4, 1fr)' } },
  galleryItem: {
    display: 'block',
    width: '100%',
    height: 'auto',
    minWidth: 0,
    borderRadius: 6,
  },
  galleryRowItem: {
    flexBasis: { default: 'auto', '@media (min-width: 640px)': 0 },
  },
  galleryRatio: (ratio: number) => ({ flexGrow: ratio }),
  noteVideo: {
    display: 'block',
    width: '100%',
    height: 'auto',
    aspectRatio: '16 / 9',
    borderWidth: 0,
  },
  noteMarkdown: {
    gap: 20,
  },
  noteHeading: {
    fontSize: 'inherit',
    marginBlockEnd: -8,
    fontWeight: 600,
    lineHeight: 'inherit',
    textWrap: 'balance',
    scrollMarginTop: 32,
  },
  noteHeadingLarge: { fontSize: 18, marginBlockStart: 44 },
  noteHeadingMedium: { marginBlockStart: 24, fontWeight: 500 },
  noteHeadingSmall: { marginBlockStart: 12, fontWeight: 500 },
  noteLink: {
    textDecorationLine: 'underline',
    textDecorationColor: { default: colors.quote, ':hover': colors.textPrimary },
    textDecorationThickness: 1,
  },
  noteList: {
    paddingInlineStart: 26,
  },
  noteListItem: {
    marginBlock: 4,
  },
  noteQuote: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    paddingInlineStart: 24,
  },
  noteRule: {
    borderWidth: 0,
    borderBlockStartWidth: 1,
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: colors.ruleSoft,
    marginBlock: 28,
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
  pre: { component: CodeBlock },
}

type GalleryMediaProps = { width?: string | number; height?: string | number; controls?: unknown; children?: ReactNode }

function collectMedia(children: ReactNode): ReactElement<GalleryMediaProps>[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement<GalleryMediaProps>(child)) return []
    if (child.type === 'img' || child.type === 'video') return [child]
    return collectMedia(child.props.children)
  })
}

function galleryItem(item: ReactElement<GalleryMediaProps>, index: number, isRow: boolean) {
  const ratio = Number(item.props.width) / Number(item.props.height) || 1
  // Videos without controls behave like silent loops, the way the clips were posted.
  const loop = item.type === 'video' && !item.props.controls ? { autoPlay: true, muted: true, loop: true, playsInline: true } : {}
  return cloneElement(item, { key: index, ...loop,
    ...stylex.props(styles.galleryItem, isRow && styles.galleryRowItem, isRow && styles.galleryRatio(ratio)) })
}

/**
 * `<Gallery layout="row|grid" columns="2|3|4" width="wide|text" caption="…">` with `<img>` and `<video>` children.
 * Rows share one height per row; `columns` on a row layout splits the items into rows of that many.
 */
function NoteGallery({ children, layout = 'grid', columns, width = 'wide', caption }:
  { children?: ReactNode; layout?: string; columns?: string; width?: string; caption?: string }) {
  const media = collectMedia(children)
  const perRow = Number(columns) || media.length
  const rows = Array.from({ length: Math.ceil(media.length / perRow) }, (_, row) => media.slice(row * perRow, (row + 1) * perRow))
  const columnStyle = columns === '4' ? styles.galleryCols4 : columns === '3' ? styles.galleryCols3 : styles.galleryCols2
  return (
    <figure {...stylex.props(styles.noteFigure, width !== 'text' && styles.wideMedia)}>
      {layout === 'row' ? (
        <div {...stylex.props(styles.galleryRows)}>
          {rows.map((items, row) => (
            <div key={row} {...stylex.props(styles.galleryRow)}>
              {items.map((item, index) => galleryItem(item, index, true))}
            </div>
          ))}
        </div>
      ) : (
        <div {...stylex.props(styles.galleryGrid, columnStyle)}>
          {media.map((item, index) => galleryItem(item, index, false))}
        </div>
      )}
      {caption && <figcaption {...stylex.props(styles.noteCaption)}>{caption}</figcaption>}
    </figure>
  )
}

function NoteVideo({ src, title, ...props }: ComponentProps<'iframe'>) {
  return (
    <iframe {...props} src={src?.replaceAll('&amp;', '&')} title={title || 'Embedded video'}
      {...stylex.props(styles.noteVideo, styles.wideMedia, styles.noteMedia)} />
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
  img: { props: stylex.props(styles.image, styles.wideMedia, styles.noteMedia) },
  video: { props: stylex.props(styles.image, styles.wideMedia, styles.noteMedia) },
  audio: { props: stylex.props(styles.wideMedia, styles.noteMedia) },
  figure: { props: stylex.props(styles.noteFigure) },
  figcaption: { props: stylex.props(styles.noteCaption) },
  iframe: { component: NoteVideo },
  Tweet: { component: NoteTweet },
  Gallery: { component: NoteGallery },
}
