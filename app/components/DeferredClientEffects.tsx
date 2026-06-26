'use client'

import dynamic from 'next/dynamic'

const Canvas = dynamic(() => import('./Canvas'), { ssr: false })
const Analytics = dynamic(() => import('@vercel/analytics/react').then((mod) => mod.Analytics), { ssr: false })
const SpeedInsights = dynamic(() => import('@vercel/speed-insights/next').then((mod) => mod.SpeedInsights), { ssr: false })

export default function DeferredClientShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Canvas />
      {children}
      <SpeedInsights />
      <Analytics />
    </>
  )
}
