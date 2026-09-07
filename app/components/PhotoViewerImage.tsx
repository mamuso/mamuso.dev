import Image from 'next/image'
import * as stylex from '@stylexjs/stylex'

/** Keep the cached gallery image beneath the full-size image while it loads. */
export default function PhotoViewerImage({ basename, width, height, title, collection = false, eager = !collection }: {
  basename: string; width: number; height: number; title: string; collection?: boolean; eager?: boolean
}) {
  return (
    <span {...stylex.props(styles.frame(width, width / height), collection && styles.collection(width / height))}>
      <Image src={`/assets/feed/gallery-${basename}`} width={width} height={height} alt=""
        sizes="(max-width: 479px) 120px, 160px" loading="eager" {...stylex.props(styles.preview)} />
      <Image src={`/assets/feed/${basename}`} width={width} height={height} alt={title}
        sizes={collection ? '(max-width: 639px) calc(100vw - 48px), 480px' : '(max-width: 639px) calc(100vw - 48px), min(90vw, 1200px)'}
        loading={eager ? 'eager' : 'lazy'} {...stylex.props(styles.image)} />
    </span>
  )
}

const styles = stylex.create({
  frame: (width: number, ratio: number) => ({
    display: 'block', position: 'relative',
    width: `min(${width}px, calc(100vw - 100px), calc((100dvh - 200px) * ${ratio}))`,
    maxWidth: '100%', aspectRatio: ratio,
  }),
  collection: (ratio: number) => ({ width: `min(100%, calc(70dvh * ${ratio}))` }),
  preview: { display: 'block', position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' },
  image: { display: 'block', position: 'relative', width: '100%', height: 'auto' },
})
