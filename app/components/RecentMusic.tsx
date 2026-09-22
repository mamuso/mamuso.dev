'use client'

import { useEffect, useState } from 'react'
import * as stylex from '@stylexjs/stylex'
import type { RecentTrack } from '../../lib/apple-music'
import { layout, typography } from '../styles/site'
import { colors } from '../styles/tokens.stylex'

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
      {track.bgColor ? <span aria-hidden="true" {...stylex.props(styles.glow, styles.glowColor(track.bgColor))}><span {...stylex.props(styles.noise)} /></span> : null}
      <span aria-hidden="true" {...stylex.props(styles.cover, styles.tilt(tilt))}>
      {track.artwork ? (
        // Apple artwork URLs are allowlisted by our server; no image proxy is needed.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.artwork} alt="" width={72} height={72} referrerPolicy="no-referrer" {...stylex.props(styles.artwork)} />
      ) : <span aria-hidden="true" {...stylex.props(styles.artwork, styles.placeholder)}>♪</span>}
      </span>
      <span title={`${introduction} ${track.name} ${track.artist}`} {...stylex.props(styles.details)}>
        <span {...stylex.props(typography.muted, styles.introduction)}>{introduction}</span>{' '}
        <span {...stylex.props(styles.song)}>{track.name}</span>{' '}
        <span {...stylex.props(typography.muted, styles.artist)}>{track.artist}</span>
      </span>
    </>
  )

  return (
    <section aria-label="Recently played music" {...stylex.props(layout.fullBleed, styles.section)}>
      <div {...stylex.props(layout.container)}>
        {track.url ? (
          <a href={track.url} rel="noreferrer" {...stylex.props(typography.link, styles.module)}>{contents}</a>
        ) : <div {...stylex.props(styles.module)}>{contents}</div>}
      </div>
    </section>
  )
}

const styles = stylex.create({
  section: {
    isolation: 'isolate',
    overflow: 'hidden',
    position: 'relative',
    marginBlockStart: 80,
    marginBlockEnd: -64,
    paddingBlockStart: 32,
    paddingBlockEnd: 24,
  },
  module: {
    alignItems: 'center',
    display: 'flex',
    flexGrow: 1,
    fontSize: 'inherit',
    gap: 18,
    width: { default: '100%', '@media (min-width: 880px)': 'auto' },
    minWidth: 0,
  },
  cover: {
    alignSelf: 'flex-end',
    display: 'block',
    flexShrink: 0,
    height: 56,
    width: 72,
    position: 'relative',
    top: 30,
  },
  tilt: (degrees: number) => ({
    transform: `rotate(${degrees}deg)`,
  }),
  artwork: {
    backgroundColor: colors.placeholder,
    borderRadius: 5,
    boxShadow: '0 0 0 1px rgb(0 0 0 / 0.06), 0 1px 1px -0.5px rgb(0 0 0 / 0.06), 0 3px 3px -1.5px rgb(0 0 0 / 0.06), 0 6px 6px -3px rgb(0 0 0 / 0.06), 0 12px 12px -6px rgb(0 0 0 / 0.06), 0 24px 24px -12px rgb(0 0 0 / 0.06)',
    display: 'block',
    height: 72,
    objectFit: 'cover',
    width: 72,
  },
  glow: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: -1,
    opacity: 0.2,
    maskImage: 'radial-gradient(ellipse 440px 150px at 25% 115%, black, transparent)',
  },
  glowColor: (color: string) => ({ backgroundColor: color }),
  noise: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url("/images/music-grain.svg")',
    opacity: 0.3,
    mixBlendMode: 'soft-light',
  },
  placeholder: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
  },
  details: {
    minWidth: 0,
    paddingBlock: 4,
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
