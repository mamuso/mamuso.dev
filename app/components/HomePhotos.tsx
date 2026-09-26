'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { homeLink } from '../styles/homeLink.stylex'
import { colors } from '../styles/tokens.stylex'

type Photo = { basename: string; width: number; height: number }

export default function HomePhotos({ photos }: { photos: Photo[] }) {
  const link = useRef<HTMLAnchorElement>(null)
  const [touchRevealed, setTouchRevealed] = useState(false)
  const [avoidingPhoto, setAvoidingPhoto] = useState<number | null>(null)
  const [retreatingPhotos, setRetreatingPhotos] = useState<number[]>([])
  const retreatTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>())
  const [visitedPhotos, setVisitedPhotos] = useState<number[]>([])
  const [poses, setPoses] = useState(() => photos.map((_, index) => ({
    angle: index % 2 ? 1 : -1,
    layer: index + 1,
    drop: index % 2 ? 8 : 6,
  })))

  useEffect(() => {
    const node = link.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setTouchRevealed(true)
      observer.disconnect()
    }, { threshold: 0.5 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const timers = retreatTimers.current
    return () => { timers.forEach(clearTimeout); timers.clear() }
  }, [])

  function finishRetreat(index: number) {
    clearTimeout(retreatTimers.current.get(index))
    retreatTimers.current.delete(index)
    setRetreatingPhotos(current => current.filter(photo => photo !== index))
  }

  function beginRetreat(index: number) {
    setAvoidingPhoto(index)
    setVisitedPhotos(current => current.includes(index) ? current : [...current, index])
    if (retreatTimers.current.has(index)) return
    setRetreatingPhotos(current => [...current, index])
    // Transitionend releases each print at the bottom. The timeout also handles
    // reduced motion, cancelled transitions, or a print that was already hidden.
    retreatTimers.current.set(index, setTimeout(() => finishRetreat(index), 560))
  }

  function arrange() {
    setVisitedPhotos([])
    const layers = photos.map((_, index) => index + 1)
    for (let index = layers.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1))
      ;[layers[index], layers[other]] = [layers[other], layers[index]]
    }
    const direction = Math.random() < 0.5 ? -1 : 1
    setPoses(photos.map((_, index) => ({
      angle: (index % 2 ? -direction : direction) * Math.random() * 3,
      layer: layers[index],
      drop: 4 + Math.random() * 6,
    })))
  }

  function neighborTilt(index: number) {
    if (avoidingPhoto === null || Math.abs(index - avoidingPhoto) !== 1) return 0
    return Math.sign(index - avoidingPhoto) * 2.5
  }

  return (
    <Link ref={link} href="/photos" aria-labelledby="home-photos" data-home-photos
      onPointerEnter={event => { if (event.pointerType !== 'touch') arrange() }}
      onFocus={event => {
        if (event.currentTarget.matches(':focus-visible') && window.matchMedia('(hover: hover)').matches) arrange()
      }}
      {...stylex.props(homeLink, styles.module)}>
      <h2 id="home-photos" {...stylex.props(styles.heading)}>Say cheese!</h2>
      <span aria-hidden="true" {...stylex.props(styles.gallery)}>
        {photos.map((photo, index) => (
          <span key={photo.basename} data-home-photo
            onTransitionEnd={event => {
              if (event.target !== event.currentTarget || event.propertyName !== 'transform' || !retreatTimers.current.has(index)) return
              // A queued end event from the upward movement must not release
              // a newly started retreat when the pointer sweeps across quickly.
              const print = event.currentTarget
              const y = new DOMMatrixReadOnly(getComputedStyle(print).transform).m42
              if (y >= print.offsetHeight + 19) finishRetreat(index)
            }}
            {...stylex.props(styles.print, styles.reaction(neighborTilt(index)), styles.pose(index, poses[index].angle, poses[index].layer, poses[index].drop, avoidingPhoto === index || retreatingPhotos.includes(index), visitedPhotos.includes(index), touchRevealed))}>
            <Image src={`/assets/feed/gallery-${photo.basename}`} width={photo.width} height={photo.height}
              alt="" draggable={false} sizes="40px" {...stylex.props(styles.image)} />
          </span>
        ))}
        {/* Fixed, non-overlapping lanes keep moving prints from exchanging hover. */}
        {photos.map((photo, index) => (
          <span key={`hover-${photo.basename}`} data-photo-hover-zone={index}
            onPointerEnter={event => {
              if (event.pointerType === 'touch') return
              beginRetreat(index)
            }}
            onPointerLeave={() => setAvoidingPhoto(current => current === index ? null : current)}
            onPointerCancel={() => setAvoidingPhoto(current => current === index ? null : current)}
            {...stylex.props(styles.hoverZone(index, photos.length))} />
        ))}
      </span>
    </Link>
  )
}

const styles = stylex.create({
  module: {
    display: 'block',
    position: 'relative',
    color: colors.textPrimary,
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
    width: 44,
    padding: 2,
    backgroundColor: colors.surface,
    transitionProperty: 'transform, rotate',
    transformOrigin: 'center bottom',
  },
  reaction: (angle: number) => ({
    rotate: { default: `${angle}deg`, '@media (prefers-reduced-motion: reduce)': '0deg' },
  }),
  hoverZone: (index: number, count: number) => ({
    position: 'absolute',
    right: `calc(4px + min(${index * 38}px, ${index * 16.5}%))`,
    bottom: 0,
    // Each lane ends exactly where its neighbor begins. Only the leftmost
    // print needs its full width because it has no neighbor on that side.
    width: index === count - 1 ? 44 : 'min(38px, 16.5%)',
    height: 44,
    pointerEvents: 'auto',
    zIndex: 10,
  }),
  pose: (index: number, angle: number, layer: number, drop: number, avoidingPointer: boolean, visited: boolean, touchRevealed: boolean) => ({
    right: `calc(4px + min(${index * 38}px, ${index * 16.5}%))`,
    zIndex: layer,
    boxShadow: `0 1px 2px rgba(0, 0, 0, ${0.1 + layer * 0.008}), 0 4px 10px rgba(0, 0, 0, ${0.06 + layer * 0.01})`,
    transitionTimingFunction: {
      default: avoidingPointer
        ? 'cubic-bezier(0.45, 0, 0.55, 1), cubic-bezier(0.4, 0, 0.2, 1)'
        : 'cubic-bezier(0.25, 0.8, 0.25, 1), cubic-bezier(0.4, 0, 0.2, 1)',
      '@media (hover: none)': 'cubic-bezier(0.22, 1, 0.36, 1)',
    },
    transitionDuration: {
      default: '300ms, 320ms',
      '@media (hover: none)': '440ms',
      '@media (hover: hover)': {
        [stylex.when.ancestor(':hover', homeLink)]: avoidingPointer ? '480ms, 320ms' : '320ms, 320ms',
      },
      [stylex.when.ancestor(':focus-visible', homeLink)]: avoidingPointer ? '480ms, 320ms' : '320ms, 320ms',
      '@media (prefers-reduced-motion: reduce)': '0ms',
    },
    transform: {
      default: `translateY(calc(100% + 20px)) rotate(${-angle}deg)`,
      // Touch reveals once; scrolling never retriggers the hover retreat.
      '@media (hover: none)': touchRevealed
        ? `translateY(${index % 2 ? 8 : 6}px) rotate(${index % 2 ? 1 : -1}deg)`
        : 'translateY(64px) rotate(0deg)',
      '@media (hover: hover)': {
        [stylex.when.ancestor(':hover', homeLink)]: avoidingPointer
          ? `translateY(calc(100% + 20px)) rotate(${-angle}deg)`
          : `translateY(${drop}px) rotate(${angle}deg)`,
      },
      [stylex.when.ancestor(':focus-visible', homeLink)]: avoidingPointer
        ? `translateY(calc(100% + 20px)) rotate(${-angle}deg)`
        : `translateY(${drop}px) rotate(${angle}deg)`,
    },
    transitionDelay: {
      default: '0ms, 0ms',
      '@media (hover: none)': `${index * 28}ms`,
      '@media (hover: hover)': {
        [stylex.when.ancestor(':hover', homeLink)]: `${avoidingPointer ? 0 : visited ? 80 : (layer - 1) * 45}ms, 0ms`,
      },
      [stylex.when.ancestor(':focus-visible', homeLink)]: `${avoidingPointer ? 0 : visited ? 80 : (layer - 1) * 45}ms, 0ms`,
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
