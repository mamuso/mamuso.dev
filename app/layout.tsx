import * as stylex from '@stylexjs/stylex'
import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '../lib/constants'
import Header from './components/Header'
import Footer from './components/Footer'
import { layout, typography } from './styles/site'
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
        <link rel="alternate" type="application/rss+xml" title="mamuso.dev RSS" href={`${BLOG_URL}/feed.xml`}></link>
      </head>
      <body {...stylex.props(typography.root)}>
        <div {...stylex.props(layout.container, styles.page)}>
          <Header />
          <main {...stylex.props(styles.main)}>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}

const styles = stylex.create({
  page: {
    alignContent: 'start',
    columnGap: 16,
    display: 'grid',
    gridTemplateColumns: {
      default: 'repeat(4, minmax(0, 1fr))',
      '@media (min-width: 640px)': 'repeat(8, minmax(0, 1fr))',
    },
    gridTemplateRows: 'auto 1fr auto',
    minHeight: '100dvh',
    paddingBlock: 24,
    position: 'relative',
    rowGap: {
      default: 24,
      '@media (min-width: 640px)': 32,
    },
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gridColumn: '1 / -1',
    minHeight: 0,
    minWidth: 0,
  },
})
