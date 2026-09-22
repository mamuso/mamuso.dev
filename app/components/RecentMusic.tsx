'use client'

import { useEffect, useState } from 'react'
import * as stylex from '@stylexjs/stylex'
import type { RecentTrack } from '../../lib/apple-music'
import { typography } from '../styles/site'
import { colors } from '../styles/tokens.stylex'
import { musicModule } from '../styles/musicModule.stylex'

const introductions = [
  'On repeat',
  'Vibing to',
  'Recent noise',
  'Ear candy',
  'Soundtracking',
  'Now-ish playing',
  'Recently spun',
  'Caught listening to',
  'Noise of the moment',
  'Playing, give or take',
  'Currently spinning',
  'On the stereo',
  'Sonic situation',
  'Probably playing',
]

export default function RecentMusic() {
  const [music, setMusic] = useState<{ track: RecentTrack | null, introduction: string, tilt: number } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const introduction = introductions[Math.floor(Math.random() * introductions.length)]
    const tilt = Math.random() * 4 - 2
    async function refresh() {
      if (document.hidden) return
      try {
        const response = await fetch('/api/music', { signal: controller.signal })
        if (!response.ok) return
        const data: { track: RecentTrack | null } = await response.json()
        setMusic({ track: data.track, introduction, tilt })
      } catch {
        // The footer stays usable when the optional music service is unavailable.
      }
    }
    void refresh()
    const timer = window.setInterval(refresh, 120_000)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [])

  if (!music?.track) return null
  const { track, introduction, tilt } = music

  const contents = (
    <>
      {track.bgColor ? <span aria-hidden="true" {...stylex.props(styles.glow)}><span {...stylex.props(styles.glowColor(track.bgColor), styles.tint)} /><span {...stylex.props(styles.noise)} /></span> : null}
      <span title={`${introduction} ${track.name}, ${track.artist}`} {...stylex.props(styles.details)}>
        <span {...stylex.props(typography.muted, styles.introduction)}>{introduction}</span>{' '}
        <span {...stylex.props(styles.song)}>{track.name},</span>{' '}
        <span {...stylex.props(styles.artist)}>{track.artist}</span>
      </span>
      <span aria-hidden="true" {...stylex.props(styles.cover, styles.tilt(tilt))}>
        {track.artwork ? (
          // Apple artwork URLs are allowlisted by our server; no image proxy is needed.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.artwork} alt="" width={52} height={52} referrerPolicy="no-referrer" {...stylex.props(styles.artwork)} />
        ) : <span aria-hidden="true" {...stylex.props(styles.artwork, styles.placeholder)}>♪</span>}
      </span>
    </>
  )

  return track.url ? (
    <a aria-label={`${introduction} ${track.name}, ${track.artist}`} href={track.url} rel="noreferrer" {...stylex.props(musicModule, styles.link, styles.module)}>{contents}</a>
  ) : <div {...stylex.props(musicModule, styles.module)}>{contents}</div>
}

const styles = stylex.create({
  link: {
    textDecorationLine: { default: 'none', ':focus-visible': 'underline' },
    textUnderlineOffset: 3,
  },
  module: {
    color: colors.textPrimary,
    alignItems: 'center',
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'flex-end',
    textAlign: 'right',
    fontSize: 'inherit',
    gap: 14,
    width: { default: '100%', '@media (min-width: 880px)': 'auto' },
    minWidth: 0,
  },
  cover: {
    alignSelf: 'flex-end',
    display: 'block',
    flexShrink: 0,
    height: { default: 52, '@media (min-width: 880px)': 22 },
    width: 52,
    position: 'relative',
    top: -8,
    transitionProperty: 'transform',
    transitionDuration: { default: '320ms', '@media (prefers-reduced-motion: reduce)': '0ms' },
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
    transformOrigin: '26px 26px',
  },
  tilt: (degrees: number) => ({
    transform: {
      default: `rotate(${degrees}deg)`,
      '@media (hover: hover) and (pointer: fine)': {
        default: `rotate(${degrees}deg)`,
        [stylex.when.ancestor(':hover', musicModule)]: `translateY(-3px) rotate(${degrees + 1.5}deg)`,
      },
      [stylex.when.ancestor(':focus-visible', musicModule)]: `translateY(-3px) rotate(${degrees + 1.5}deg)`,
      '@media (prefers-reduced-motion: reduce)': `rotate(${degrees}deg)`,
    },
  }),
  artwork: {
    backgroundColor: colors.placeholder,
    borderRadius: 5,
    boxShadow: '0 0 0 1px rgb(0 0 0 / 0.06), 0 1px 1px -0.5px rgb(0 0 0 / 0.06), 0 3px 3px -1.5px rgb(0 0 0 / 0.06), 0 6px 6px -3px rgb(0 0 0 / 0.06), 0 12px 12px -6px rgb(0 0 0 / 0.06), 0 24px 24px -12px rgb(0 0 0 / 0.06)',
    display: 'block',
    height: 52,
    objectFit: 'cover',
    width: 52,
  },
  glow: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: -1,
    maskImage: 'radial-gradient(ellipse 230px 80px at calc(100% - max(80px, calc((100vw - 960px) / 2))) 110%, black, transparent)',
  },
  tint: { position: 'absolute', inset: 0, opacity: 0.09 },
  glowColor: (color: string) => ({ backgroundColor: color }),
  noise: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url("/images/music-grain.svg")',
    opacity: 0.12,
  },
  placeholder: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
  },
  details: {
    minWidth: 0,
    overflowWrap: 'anywhere',
  },
  introduction: {
    display: { default: 'block', '@media (min-width: 880px)': 'inline' },
  },
  song: {
    display: { default: 'block', '@media (min-width: 880px)': 'inline' },
  },
  artist: {
    display: { default: 'block', '@media (min-width: 880px)': 'inline' },
  },
})
