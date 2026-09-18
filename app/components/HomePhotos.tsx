'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { homeLink } from '../styles/homeLink.stylex'
import { colors } from '../styles/tokens.stylex'

type Photo = { basename: string; width: number; height: number }

export default function HomePhotos({ photos }: { photos: Photo[] }) {
  const [poses, setPoses] = useState(() => photos.map((_, index) => ({
    angle: index % 2 ? 1 : -1,
    layer: index + 1,
    drop: 12,
  })))

  function arrange() {
    const layers = photos.map((_, index) => index + 1)
    for (let index = layers.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1))
      ;[layers[index], layers[other]] = [layers[other], layers[index]]
    }
    const direction = Math.random() < 0.5 ? -1 : 1
    setPoses(photos.map((_, index) => ({
      angle: (index % 2 ? -direction : direction) * (0.4 + Math.random() * 1.6),
      layer: layers[index],
      drop: 8 + Math.random() * 10,
    })))
  }

  return (
    <Link href="/photos" aria-labelledby="home-photos" data-home-photos
      onMouseEnter={arrange}
      onFocus={event => { if (!event.currentTarget.matches(':hover')) arrange() }}
      {...stylex.props(homeLink, styles.module)}>
      <h2 id="home-photos" {...stylex.props(styles.heading)}>Say cheese!</h2>
      <span aria-hidden="true" {...stylex.props(styles.gallery)}>
        {photos.map((photo, index) => (
          <span key={photo.basename} data-home-photo
            {...stylex.props(styles.print, styles.pose(index, poses[index].angle, poses[index].layer, poses[index].drop))}>
            <Image src={`/assets/feed/gallery-${photo.basename}`} width={photo.width} height={photo.height}
              alt="" draggable={false} sizes="72px" {...stylex.props(styles.image)} />
          </span>
        ))}
      </span>
    </Link>
  )
}

const styles = stylex.create({
  module: {
    display: 'block',
    position: 'relative',
    color: '#17181B',
    textDecoration: { default: 'none', ':focus-visible': 'underline' },
    textUnderlineOffset: 3,
    outlineOffset: 4,
    borderBlockEndWidth: 0.5,
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: colors.rule,
  },
  heading: {
    fontSize: 18,
    lineHeight: '24px',
    fontWeight: 400,
    margin: 0,
    paddingBlock: 4,
  },
  gallery: {
    position: 'absolute',
    insetInlineStart: 120,
    insetInlineEnd: 0,
    bottom: 0,
    height: 112,
    overflow: 'hidden',
    pointerEvents: 'none',
    isolation: 'isolate',
  },
  print: {
    position: 'absolute',
    bottom: 0,
    display: 'block',
    boxSizing: 'border-box',
    width: 'min(23%, 72px)',
    padding: { default: 5, '@media (min-width: 480px)': 6 },
    backgroundColor: colors.surface,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.14), 0 4px 10px rgba(0, 0, 0, 0.1)',
    opacity: {
      default: 0,
      '@media (hover: hover)': { [stylex.when.ancestor(':hover', homeLink)]: 1 },
      [stylex.when.ancestor(':focus-visible', homeLink)]: 1,
    },
    transitionProperty: 'transform, opacity',
    transitionDuration: { default: '360ms', '@media (prefers-reduced-motion: reduce)': '0ms' },
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  pose: (index: number, angle: number, layer: number, drop: number) => ({
    right: `${2 + index * 15}%`,
    zIndex: layer,
    transform: {
      default: `translateY(115%) rotate(${angle}deg)`,
      '@media (hover: hover)': {
        [stylex.when.ancestor(':hover', homeLink)]: `translateY(${drop}px) rotate(${angle}deg)`,
      },
      [stylex.when.ancestor(':focus-visible', homeLink)]: `translateY(${drop}px) rotate(${angle}deg)`,
    },
    transitionDelay: {
      default: `${(6 - layer) * 20}ms`,
      '@media (hover: hover)': {
        [stylex.when.ancestor(':hover', homeLink)]: `${(layer - 1) * 45}ms`,
      },
      [stylex.when.ancestor(':focus-visible', homeLink)]: `${(layer - 1) * 45}ms`,
      '@media (prefers-reduced-motion: reduce)': '0ms',
    },
  }),
  image: {
    display: 'block',
    width: '100%',
    height: 'auto',
    aspectRatio: '1',
    objectFit: 'cover',
    backgroundColor: colors.placeholder,
  },
})
