const STORAGE_KEY = 'photo-gallery-origin'

export type GalleryOrigin = { href: string; scrollY: number }

export function parseGalleryOrigin(value: string | null): GalleryOrigin | null {
  try {
    const origin = JSON.parse(value ?? 'null')
    if (!origin || typeof origin.href !== 'string' || !/^\/photos(?:\?page=[1-9]\d*)?$/.test(origin.href) ||
      typeof origin.scrollY !== 'number' || !Number.isFinite(origin.scrollY) || origin.scrollY < 0) return null
    return { href: origin.href, scrollY: origin.scrollY }
  } catch { return null }
}

let memory: string | null = null
let pending: GalleryOrigin | null = null

export function readGalleryOrigin(): string | null {
  try { return sessionStorage.getItem(STORAGE_KEY) ?? memory } catch { return memory }
}

export function rememberGalleryOrigin(origin: GalleryOrigin) {
  memory = JSON.stringify(origin)
  try { sessionStorage.setItem(STORAGE_KEY, memory) } catch { /* In-memory restoration still works. */ }
}

export function requestGalleryReturn(origin: GalleryOrigin) { pending = origin }

export function consumeGalleryReturn(href: string): GalleryOrigin | null {
  if (pending?.href !== href) return null
  const origin = pending
  pending = null
  return origin
}
