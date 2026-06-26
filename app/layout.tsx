import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '../lib/constants'
import { themeInitScript } from '../lib/theme'
import Header from './components/Header'
import Footer from './components/Footer'
import DeferredClientShell from './components/DeferredClientEffects'
import './globals.css'

export const metadata = {
  title: {
    default: `${BLOG_TITLE} – ${BLOG_SUBTITLE}`,
  },
  description: { default: BLOG_SUBTITLE },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="alternate" type="application/rss+xml" title="mamuso.dev RSS" href={`${BLOG_URL}/feed.xml`}></link>
      </head>
      <body>
        <DeferredClientShell>
          <div id="page-content">
            <Header />
            {children}
            <Footer />
          </div>
        </DeferredClientShell>
      </body>
    </html>
  )
}
