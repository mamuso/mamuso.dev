'use client'

import { ViewTransition, type ReactNode } from 'react'
import type {} from 'react/canary'

/** Keep the same photo identity across gallery, collection and detail routes. */
export default function PhotoTransition({ slug, children }: { slug?: string; children: ReactNode }) {
  if (!slug) return children
  return <ViewTransition name={`photo-${slug}`} default="none" share="photo-morph">{children}</ViewTransition>
}
