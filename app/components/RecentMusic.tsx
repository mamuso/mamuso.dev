'use client'

import { useEffect, useState } from 'react'
import * as stylex from '@stylexjs/stylex'
import type { RecentTrack } from '../../lib/apple-music'
import { typography } from '../styles/site'
import { colors, type } from '../styles/tokens.stylex'

export default function RecentMusic() {
  const [track, setTrack] = useState<RecentTrack | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    async function refresh() {
      if (document.hidden) return
      try {
        const response = await fetch('/api/music', { signal: controller.signal })
        if (!response.ok) return
        const data: { track: RecentTrack | null } = await response.json()
        setTrack(data.track)
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

  if (!track) return null

  const contents = (
    <>
      {track.artwork ? (
        // Apple artwork URLs are allowlisted by our server; no image proxy is needed.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.artwork} alt="" width={40} height={40} referrerPolicy="no-referrer" {...stylex.props(styles.artwork)} />
      ) : <span aria-hidden="true" {...stylex.props(styles.artwork, styles.placeholder)}>♪</span>}
      <span {...stylex.props(styles.details)}>
        <span {...stylex.props(typography.muted, styles.label)}>Last played · Apple Music</span>
        <span {...stylex.props(styles.song)}>{track.name} <span {...stylex.props(typography.muted)}>· {track.artist}</span></span>
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
    gap: 10,
    maxWidth: '100%',
    minWidth: 0,
  },
  artwork: {
    backgroundColor: colors.placeholder,
    borderRadius: 4,
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
  details: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  label: { fontSize: type.sizeCaption },
  song: { fontSize: type.sizeSmall, overflowWrap: 'anywhere' },
})
