'use client'

import Link from 'next/link'
import { useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import * as stylex from '@stylexjs/stylex'
import { typography } from '@/app/styles/site'

/** The URL records loaded batches; automatic loading must not fill the Back history. */
export default function GalleryInfiniteScroll({ page, hasMore, visibleCount, totalCount }: {
  page: number; hasMore: boolean; visibleCount: number; totalCount: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!hasMore || pending || !sentinel.current) return
    let requested = false
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || requested) return
      requested = true
      observer.disconnect()
      startTransition(() => router.replace(`/photos?page=${page + 1}`, { scroll: false }))
    }, { rootMargin: '400px 0px' })
    observer.observe(sentinel.current)
    return () => observer.disconnect()
  }, [hasMore, page, pending, router])
  return (
    <div ref={sentinel} data-gallery-sentinel {...stylex.props(styles.sentinel)}>
      <p role="status" {...stylex.props(typography.muted, styles.status)}>
        {pending ? 'Loading photos…' : `${visibleCount} of ${totalCount}`}
      </p>
      {hasMore && <noscript><Link href={`/photos?page=${page + 1}`} {...stylex.props(typography.mutedLink)}>Next photos →</Link></noscript>}
    </div>
  )
}

const styles = stylex.create({
  sentinel: { textAlign: 'center', paddingBlock: 24, minHeight: 24 },
  status: { margin: 0, fontSize: 12 },
})
