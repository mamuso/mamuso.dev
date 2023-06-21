import Fathom from './components/Fathom'
import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '../lib/constants'
import './globals.css'

export const metadata = {
  title: `${BLOG_TITLE} – ${BLOG_SUBTITLE}`,
  description: BLOG_SUBTITLE,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Fathom />
        {children}
      </body>
    </html>
  )
}
