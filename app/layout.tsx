import dynamic from 'next/dynamic'
import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '../lib/constants'
import Header from './components/Header'
import Footer from './components/Footer'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.scss'

const Canvas = dynamic(() => import('./components/Canvas'), { ssr: false })
const Analytics = dynamic(() => import('@vercel/analytics/react').then((mod) => mod.Analytics), { ssr: false })
const SpeedInsights = dynamic(() => import('@vercel/speed-insights/next').then((mod) => mod.SpeedInsights), { ssr: false })

export const metadata = {
  title: {
    default: `${BLOG_TITLE} – ${BLOG_SUBTITLE}`,
  },
  description: { default: BLOG_SUBTITLE },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="alternate" type="application/rss+xml" title="mamuso.dev RSS" href={`${BLOG_URL}/feed.xml`}></link>
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <Canvas />
        <div id="page-content">
          <Header />
          {children}
          <Footer />
        </div>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
