import Fathom from './components/Fathom'
import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '../lib/constants'
import Header from './components/Header'
import Footer from './components/Footer'
import './globals.css'

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
        <link rel="alternate" type="application/rss+xml" title="RSS" href={`${BLOG_URL}/feed.xml`}></link>
      </head>
      <body>
        <Fathom />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
