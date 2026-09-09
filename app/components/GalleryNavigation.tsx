'use client'

import { useLayoutEffect, type ComponentPropsWithoutRef } from 'react'
import { consumeGalleryReturn, rememberGalleryOrigin } from './gallery-return'

/** Restore before React measures the destination shared elements, not in an effect. */
export default function GalleryNavigation({ page, ...props }: ComponentPropsWithoutRef<'ul'> & { page: number }) {
  const href = page === 1 ? '/photos' : `/photos?page=${page}`
  useLayoutEffect(() => {
    const origin = consumeGalleryReturn(href)
    if (origin) window.scrollTo({ top: origin.scrollY, behavior: 'instant' })
  }, [href])

  return <ul {...props} onClickCapture={(event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = event.target instanceof Element ? event.target.closest('a') : null
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return
    const target = new URL(link.href)
    if (target.origin !== location.origin || !/^\/(?:note\/|photos\/stack\/)/.test(target.pathname)) return
    rememberGalleryOrigin({ href, scrollY: window.scrollY })
  }} />
}
