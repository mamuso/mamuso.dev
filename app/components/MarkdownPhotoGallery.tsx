import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'

const GALLERY_HEIGHT = 320

type ImgProps = {
  src?: string
  alt?: string
  width?: number | string
  height?: number | string
  className?: string
}

function GalleryImage({ src, alt, width, height, className }: ImgProps) {
  const w = Number(width) || 1600
  const h = Number(height) || 1200
  const flexGrow = (w * GALLERY_HEIGHT) / h

  return (
    <div style={{ width: `${flexGrow}px`, flexGrow: `${flexGrow}` }}>
      <i style={{ paddingBottom: `${(h / w) * 100}%` }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt || ''} width={w} height={h} className={['loaded', className].filter(Boolean).join(' ')} />
    </div>
  )
}

function isImgElement(child: ReactNode): child is ReactElement<ImgProps> {
  return isValidElement(child) && child.type === 'img'
}

function transformGalleryContent(node: ReactNode): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return child

    if (isImgElement(child)) {
      return <GalleryImage key={child.props.src} {...child.props} />
    }

    if (child.props.children) {
      return cloneElement(child, undefined, transformGalleryContent(child.props.children))
    }

    return child
  })
}

export function MarkdownPhotoGallery({ children }: { children: ReactNode }) {
  return <div className="photo-gallery">{transformGalleryContent(children)}</div>
}

export const markdownOverrides = {
  div: {
    component: ({
      className,
      class: htmlClass,
      children,
      ...props
    }: {
      className?: string
      class?: string
      children?: ReactNode
    }) => {
      const classes = className || htmlClass || ''
      if (classes.includes('photo-gallery')) {
        return <MarkdownPhotoGallery>{children}</MarkdownPhotoGallery>
      }
      return (
        <div className={classes || undefined} {...props}>
          {children}
        </div>
      )
    },
  },
}
