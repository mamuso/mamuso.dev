'use client'

import { useEffect, useState } from 'react'
import * as stylex from '@stylexjs/stylex'
import type { RecentTrack, RecentMusicResult } from '../../lib/apple-music'
import { typography } from '../styles/site'
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
    let disposed = false
    let request: AbortController | undefined
    const introduction = introductions[Math.floor(Math.random() * introductions.length)]
    const tilt = Math.random() * 4 - 2
    let timer: number | undefined
    let pending = false
    async function refresh() {
      if (document.hidden || pending || disposed) return
      window.clearTimeout(timer)
      pending = true
      const controller = new AbortController()
      request = controller
      const timeout = window.setTimeout(() => controller.abort(), 8000)
      let delay = 15_000
      try {
        const response = await fetch('/api/music', { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('Music unavailable')
        const data: RecentMusicResult = await response.json()
        if (data.status !== 'empty' && (data.status !== 'ready' || !data.track ||
          typeof data.track.name !== 'string' || typeof data.track.artist !== 'string')) {
          throw new Error('Invalid music response')
        }
        if (disposed) return
        setMusic({ track: data.status === 'ready' ? data.track : null, introduction, tilt })
        delay = 240_000
      } catch {
        // Never leave an old song visible when refresh fails or times out.
        if (!disposed) setMusic(null)
      } finally {
        window.clearTimeout(timeout)
        pending = false
        if (!disposed) timer = window.setTimeout(refresh, delay)
      }
    }
    const onVisible = () => { if (!document.hidden) void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    void refresh()
    return () => {
      disposed = true
      request?.abort()
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
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
          <img src={track.artwork} alt="" width={48} height={48} referrerPolicy="no-referrer" {...stylex.props(styles.artwork)} />
        ) : <span aria-hidden="true" {...stylex.props(styles.artwork, styles.placeholder)}>♪</span>}
      </span>
    </>
  )

  return track.url ? (
    <a aria-label={`${introduction} ${track.name}, ${track.artist}`} href={track.url} rel="noreferrer" {...stylex.props(styles.link, styles.module)}>{contents}</a>
  ) : <div {...stylex.props(styles.module)}>{contents}</div>
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
    flexBasis: 0,
    minWidth: 0,
  },
  cover: {
    alignSelf: 'flex-end',
    display: 'block',
    flexShrink: 0,
    height: 22,
    width: 48,
    position: 'relative',
    top: -8,
    transformOrigin: '24px 24px',
  },
  tilt: (degrees: number) => ({
    transform: `rotate(${degrees}deg)`,
  }),
  artwork: {
    backgroundColor: colors.placeholder,
    borderRadius: 5,
    boxShadow: '0 0 0 1px rgb(0 0 0 / 0.06), 0 1px 1px -0.5px rgb(0 0 0 / 0.06), 0 3px 3px -1.5px rgb(0 0 0 / 0.06), 0 6px 6px -3px rgb(0 0 0 / 0.06), 0 12px 12px -6px rgb(0 0 0 / 0.06), 0 24px 24px -12px rgb(0 0 0 / 0.06)',
    display: 'block',
    height: 48,
    objectFit: 'cover',
    width: 48,
  },
  glow: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: -1,
    maskImage: 'radial-gradient(ellipse 230px 80px at calc(100% - max(80px, calc((100vw - 960px) / 2))) 110%, black, transparent)',
  },
  tint: { position: 'absolute', inset: 0, opacity: 0.14 },
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
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  introduction: {
    display: 'inline',
  },
  song: {
    display: { default: 'none', '@media (min-width: 880px)': 'inline' },
  },
  artist: {
    display: { default: 'none', '@media (min-width: 880px)': 'inline' },
  },
})
