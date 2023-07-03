import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '../lib/constants'
import Fathom from './components/Fathom'
import Header from './components/Header'
import Footer from './components/Footer'
import Canvas from './components/Canvas'
import { monaSans } from './components/Fonts'
import './globals.scss'

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
      <body className={`${monaSans.variable}`}>
        <Fathom />
        <Canvas />
        <div id="page-content">
          <Header />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  )
}
