'use client'

import { useState, type HTMLAttributes } from 'react'
import Image from 'next/image'
import PhotoTransition from './PhotoTransition'
import * as stylex from '@stylexjs/stylex'

type Props = HTMLAttributes<HTMLSpanElement> & {
  basename: string
  width: number
  height: number
  title: string
  sizes: string
  eager?: boolean
  transitionSlug?: string
}

/** Reuse the gallery thumbnail until Next Image has decoded the larger photo. */
export default function ProgressivePhoto({ basename, width, height, title, sizes, eager = false, transitionSlug, ...props }: Props) {
  const src = `/assets/feed/${basename}`
  const [decodedSrc, setDecodedSrc] = useState<string | null>(null)

  return (
    <PhotoTransition slug={transitionSlug}>
      <span {...props} data-progressive-photo>
        <span data-photo-transition-frame {...stylex.props(styles.printFrame)}>
          <span {...stylex.props(styles.canvas(width / height))}>
            <Image src={`/assets/feed/gallery-${basename}`} fill alt="" aria-hidden="true"
              sizes="(max-width: 479px) 120px, 160px" loading={eager ? 'eager' : 'lazy'} />
            <Image src={src} fill alt={title} sizes={sizes} loading={eager ? 'eager' : 'lazy'}
              onLoad={() => setDecodedSrc(src)}
              {...stylex.props(styles.original(decodedSrc === src))} />
          </span>
        </span>
      </span>
    </PhotoTransition>
  )
}

const styles = stylex.create({
  printFrame: { display: 'block', margin: -12, padding: 12, backgroundColor: '#fff' },
  canvas: (ratio: number) => ({ display: 'block', position: 'relative', width: '100%', aspectRatio: ratio }),
  original: (decoded: boolean) => ({ opacity: decoded ? 1 : 0 }),
})
