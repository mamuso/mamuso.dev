'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import * as stylex from '@stylexjs/stylex'
import { typography } from '@/app/styles/site'
import { parseGalleryOrigin, readGalleryOrigin, requestGalleryReturn } from './gallery-return'

const subscribe = () => () => {}
const serverSnapshot = () => null

export default function BackToPhotos() {
  const saved = useSyncExternalStore(subscribe, readGalleryOrigin, serverSnapshot)
  const origin = parseGalleryOrigin(saved)
  return (
    <Link href={origin?.href ?? '/photos'} scroll={!origin}
      onNavigate={() => { if (origin) requestGalleryReturn(origin) }}
      {...stylex.props(typography.mutedLink, styles.link)}>
      <span aria-hidden="true" {...stylex.props(styles.arrow)}>←</span>
      <span>All photos</span>
    </Link>
  )
}

const styles = stylex.create({
  link: { display: 'grid', gridTemplateColumns: '24px auto', alignItems: 'center', columnGap: 4 },
  // The header logo is a 16px mark flush-left in its 24px box, not centered
  // in it — match that so the arrow lines up with the logo's visual center.
  arrow: { textAlign: 'center', width: 16 },
})
