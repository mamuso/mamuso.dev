'use client'

import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import * as stylex from '@stylexjs/stylex'
import { typography } from '@/app/styles/site'

export default function PhotoQuickLook({ title, href, children, collection = false }: { title: string; href: string; children: ReactNode; collection?: boolean }) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  useLayoutEffect(() => {
    const dialog = dialogRef.current!
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const triggerHref = trigger?.closest('a')?.getAttribute('href') ?? href
    const overflow = document.body.style.overflow
    const rootOverflow = document.documentElement.style.overflow
    const rootOverscroll = document.documentElement.style.overscrollBehavior
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'none'
    return () => {
      document.body.style.overflow = overflow
      document.documentElement.style.overflow = rootOverflow
      document.documentElement.style.overscrollBehavior = rootOverscroll
      requestAnimationFrame(() => {
        const target = trigger?.isConnected ? trigger : triggerHref
          ? document.querySelector<HTMLAnchorElement>(`a[href="${CSS.escape(triggerHref)}"]`) : null
        target?.focus({ preventScroll: true })
      })
    }
  }, [href])

  return (
    <dialog ref={dialogRef} aria-labelledby="photo-quick-look-title" data-photo-quick-look
      onCancel={(event) => { event.preventDefault(); router.back() }}
      onClick={(event) => { if (event.target === event.currentTarget) router.back() }}
      {...stylex.props(styles.dialog)}>
        <figure {...stylex.props(styles.print, collection && styles.collection)}>
          <button type="button" aria-label="Close photo" onClick={() => router.back()} {...stylex.props(styles.close)}>×</button>
          {collection ? (
            <>
              <figcaption id="photo-quick-look-title" {...stylex.props(styles.collectionTitle)}>{title}</figcaption>
              {children}
            </>
          ) : <>
            <div {...stylex.props(styles.image)}>{children}</div>
          <figcaption {...stylex.props(styles.caption)}>
            <a id="photo-quick-look-title" href={href} {...stylex.props(typography.link)}>{title}</a>
          </figcaption>
          </>}
        </figure>
    </dialog>
  )
}

const styles = stylex.create({
  dialog: { position: 'fixed', inset: 0, width: '100%', height: '100%', maxWidth: 'none', maxHeight: 'none', margin: 0, padding: { default: 24, '@media (min-width: 640px)': 40 }, boxSizing: 'border-box', borderWidth: 0, backgroundColor: 'transparent', color: 'inherit', overflow: 'auto', overscrollBehavior: 'contain' },
  collection: { width: '100%', maxWidth: 1040, marginBlock: 24 },
  collectionTitle: { fontSize: 24, color: '#62626a', marginBlockEnd: 40, paddingInlineEnd: 32 },
  print: { margin: 'auto', position: 'relative', width: 'fit-content', maxWidth: '100%' },
  close: { position: 'absolute', insetBlockStart: -38, insetInlineEnd: -8, display: 'grid', placeItems: 'center', width: 32, height: 32, borderWidth: 0, backgroundColor: 'transparent', color: '#62626a', fontSize: 28, fontWeight: 300, lineHeight: 1, cursor: 'pointer', outlineOffset: 3 },
  image: { display: 'flex', justifyContent: 'center', padding: { default: 7, '@media (min-width: 640px)': 10 }, backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 12px 32px rgba(0,0,0,0.12)' },
  caption: { paddingBlockStart: 18, fontSize: 14, textAlign: 'center', overflowWrap: 'anywhere' },
})
