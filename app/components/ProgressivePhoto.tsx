'use client'

import { useState, type HTMLAttributes } from 'react'
import Image from 'next/image'
import * as stylex from '@stylexjs/stylex'

type Props = HTMLAttributes<HTMLSpanElement> & {
  basename: string
  width: number
  height: number
  title: string
  sizes: string
  eager?: boolean
}

/** Reuse the gallery thumbnail until Next Image has decoded the larger photo. */
export default function ProgressivePhoto({ basename, width, height, title, sizes, eager = false, ...props }: Props) {
  const src = `/assets/feed/${basename}`
  const [decodedSrc, setDecodedSrc] = useState<string | null>(null)

  return (
    <span {...props} data-progressive-photo>
      <span {...stylex.props(styles.canvas(width / height))}>
        <Image src={`/assets/feed/gallery-${basename}`} fill alt="" aria-hidden="true"
          sizes="(max-width: 479px) 120px, 160px" loading={eager ? 'eager' : 'lazy'} />
        <Image src={src} fill alt={title} sizes={sizes} loading={eager ? 'eager' : 'lazy'}
          onLoad={() => setDecodedSrc(src)}
          {...stylex.props(styles.original(decodedSrc === src))} />
      </span>
    </span>
  )
}

const styles = stylex.create({
  canvas: (ratio: number) => ({ display: 'block', position: 'relative', width: '100%', aspectRatio: ratio }),
  original: (decoded: boolean) => ({ opacity: decoded ? 1 : 0 }),
})
