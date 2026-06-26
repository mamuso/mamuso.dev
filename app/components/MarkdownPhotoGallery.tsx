import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'

type ImgProps = {
  src?: string
  alt?: string
  width?: number | string
  height?: number | string
}

function GalleryImage({ src, alt, width, height }: ImgProps) {
  const w = Number(width) || 1600
  const h = Number(height) || 1200

  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt || ''} width={w} height={h} />
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
  return <div>{transformGalleryContent(children)}</div>
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
        <div {...props}>
          {children}
        </div>
      )
    },
  },
}
