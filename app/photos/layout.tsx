import { pageMetadata } from '@/lib/metadata'
import { BLOG_TITLE } from '@/lib/constants'
import type { ReactNode } from 'react'

export const metadata = pageMetadata({ title: `Photos – ${BLOG_TITLE}`, path: '/photos', description: 'Mamuso has a camera', socialTitle: 'Photos' })

export default function PhotosLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
