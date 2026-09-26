'use client'

import Link from 'next/link'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '@/app/styles/site'
import type { getPhotoGroups } from '@/lib/photo-gallery'
import PhotoStack from './PhotoStack'
import GalleryNavigation from './GalleryNavigation'

type Groups = Awaited<ReturnType<typeof getPhotoGroups>>

/** Only the initial URL is cumulative; scrolling appends one data batch at a time. */
export default function PhotoGallery({ initialGroups, initialPage, totalPages, totalCount }: {
  initialGroups: Groups; initialPage: number; totalPages: number; totalCount: number
}) {
  const [{ groups, page }, setGallery] = useState({ groups: initialGroups, page: initialPage })
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const sentinel = useRef<HTMLDivElement>(null)
  const hasMore = page < totalPages

  useLayoutEffect(() => {
    if (page !== initialPage) window.history.replaceState(null, '', `/photos?page=${page}`)
  }, [page, initialPage])

  useEffect(() => {
    if (!hasMore || status !== 'idle' || !sentinel.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      setStatus('loading')
    }, { rootMargin: '400px 0px' })
    observer.observe(sentinel.current)
    return () => observer.disconnect()
  }, [hasMore, page, status])

  useEffect(() => {
    if (status !== 'loading') return
    const controller = new AbortController()
    let active = true
    const timeout = setTimeout(() => controller.abort(), 15_000)
    async function load() {
      try {
        const response = await fetch(`/api/photos?page=${page + 1}`, { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('Photo batch unavailable')
        const batch: { groups: Groups; page: number; totalCount: number } = await response.json()
        // A deployment may change the index while this gallery is open. Reload
        // the cumulative URL instead of silently mixing incompatible windows.
        if (batch.page !== page + 1 || batch.totalCount !== totalCount || !batch.groups.length ||
          batch.groups.some(group => groups.some(existing => existing.key === group.key))) {
          throw new Error('Photo index changed')
        }
        if (!active) return
        setGallery({ groups: [...groups, ...batch.groups], page: batch.page })
        setStatus('idle')
      } catch {
        if (active) setStatus('error')
      } finally {
        clearTimeout(timeout)
      }
    }
    void load()
    return () => {
      active = false
      clearTimeout(timeout)
      controller.abort()
    }
  }, [status, page, groups, totalCount])

  return (
    <>
      <GalleryNavigation page={page} {...stylex.props(layout.list, styles.gallery)}>
        {groups.map(({ key, photos }, index) => (
          <li key={key} data-gallery-card>
            <PhotoStack eager={index < 4} photos={photos} collectionHref={photos[0].photoStack ? `/photos/stack/${encodeURIComponent(photos[0].photoStack)}` : undefined} href={`/note/${photos[0].slug}`} title={photos[0].photoStackTitle ?? photos[0].title} />
          </li>
        ))}
      </GalleryNavigation>
      <div ref={sentinel} data-gallery-sentinel {...stylex.props(styles.sentinel)}>
        <p role="status" {...stylex.props(typography.muted, typography.caption, styles.status)}>
          {status === 'loading' ? 'Loading photos…' : status === 'error' ? 'Couldn’t load more photos.' : `${groups.length} of ${totalCount}`}
        </p>
        {status === 'error' && <>
          <button type="button" onClick={() => setStatus('loading')} {...stylex.props(styles.retry, typography.mutedLink)}>Try again</button>
          {' · '}<a href={`/photos?page=${page + 1}`} {...stylex.props(typography.mutedLink)}>Reload gallery →</a>
        </>}
        {hasMore && <noscript><Link href={`/photos?page=${page + 1}`} {...stylex.props(typography.mutedLink)}>Next photos →</Link></noscript>}
      </div>
    </>
  )
}

const styles = stylex.create({
  gallery: {
    display: 'grid',
    columnGap: { default: 16, '@media (min-width: 480px)': 32 },
    rowGap: { default: 24, '@media (min-width: 480px)': 40 },
    marginBlockStart: 48,
    paddingBlockEnd: 32,
    gridTemplateColumns: {
      default: 'repeat(2, minmax(0, 1fr))',
      '@media (min-width: 640px)': 'repeat(3, minmax(0, 1fr))',
      '@media (min-width: 960px)': 'repeat(4, minmax(0, 1fr))',
    },
  },
  sentinel: { textAlign: 'center', paddingBlock: 24, minHeight: 24 },
  status: { margin: 0 },
  retry: { backgroundColor: 'transparent', borderWidth: 0, padding: 0, font: 'inherit', cursor: 'pointer' },
})
