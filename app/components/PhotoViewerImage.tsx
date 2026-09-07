import Image from 'next/image'
import * as stylex from '@stylexjs/stylex'

/** Keep the cached gallery image beneath the full-size image while it loads. */
export default function PhotoViewerImage({ basename, width, height, title, collection = false, eager = !collection }: {
  basename: string; width: number; height: number; title: string; collection?: boolean; eager?: boolean
}) {
  const ratio = width / height
  // These lengths match the frame's viewport limits, including collection borders.
  const standaloneWidth = `min(${width}px, calc(100vw - 100px), calc(${ratio * 100}dvh - ${ratio * 200}px))`
  const collectionHeightWidth = `calc(${ratio * 70}dvh - 16px)`
  const sizes = collection
    ? `(max-width: 639px) min(calc(100vw - 64px), ${collectionHeightWidth}), min(calc(50vw - 80px), 480px, ${collectionHeightWidth})`
    : standaloneWidth
  return (
    <span {...stylex.props(styles.frame(standaloneWidth, ratio), collection && styles.collection(ratio))}>
      <Image src={`/assets/feed/gallery-${basename}`} width={width} height={height} alt=""
        sizes="(max-width: 479px) 120px, 160px" loading="eager" {...stylex.props(styles.preview)} />
      <Image src={`/assets/feed/${basename}`} width={width} height={height} alt={title}
        sizes={sizes}
        loading={eager ? 'eager' : 'lazy'} {...stylex.props(styles.image)} />
    </span>
  )
}

const styles = stylex.create({
  frame: (width: string, ratio: number) => ({
    display: 'block', position: 'relative',
    width,
    maxWidth: '100%', aspectRatio: ratio,
  }),
  collection: (ratio: number) => ({ width: `min(100%, calc(70dvh * ${ratio}))` }),
  preview: { display: 'block', position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' },
  image: { display: 'block', position: 'relative', width: '100%', height: 'auto' },
})
