'use client'

import { useEffect, useState } from 'react'
import * as stylex from '@stylexjs/stylex'
import type { RecentTrack } from '../../lib/apple-music'
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
  const [music, setMusic] = useState<{ track: RecentTrack | null, introduction: string } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const introduction = introductions[Math.floor(Math.random() * introductions.length)]
    async function refresh() {
      if (document.hidden) return
      try {
        const response = await fetch('/api/music', { signal: controller.signal })
        if (!response.ok) return
        const data: { track: RecentTrack | null } = await response.json()
        setMusic({ track: data.track, introduction })
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
  const { track, introduction } = music

  const contents = (
    <>
      {track.artwork ? (
        // Apple artwork URLs are allowlisted by our server; no image proxy is needed.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.artwork} alt="" width={40} height={40} referrerPolicy="no-referrer" {...stylex.props(styles.artwork)} />
      ) : <span aria-hidden="true" {...stylex.props(styles.artwork, styles.placeholder)}>♪</span>}
      <span title={`${introduction} ${track.name} ${track.artist}`} {...stylex.props(styles.details)}>
        <span {...stylex.props(typography.muted)}>{introduction}</span>{' '}
        <span>{track.name}</span>{' '}
        <span {...stylex.props(typography.muted)}>{track.artist}</span>
      </span>
    </>
  )

  return track.url ? (
    <a href={track.url} rel="noreferrer" {...stylex.props(typography.link, styles.module)}>{contents}</a>
  ) : <div {...stylex.props(styles.module)}>{contents}</div>
}

const styles = stylex.create({
  module: {
    alignItems: 'center',
    display: 'flex',
    flexBasis: 360,
    flexGrow: 1,
    flexShrink: 1,
    fontSize: 'inherit',
    gap: 10,
    maxWidth: '100%',
    minWidth: 0,
  },
  artwork: {
    backgroundColor: colors.placeholder,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 4,
    borderStyle: 'solid',
    borderWidth: 1,
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
    boxSizing: 'border-box',
    flexShrink: 0,
    height: 40,
    objectFit: 'cover',
    width: 40,
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
})
