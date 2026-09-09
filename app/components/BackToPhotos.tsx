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
      {...stylex.props(typography.mutedLink)}>
      ← All photos
    </Link>
  )
}
