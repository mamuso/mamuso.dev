import * as stylex from '@stylexjs/stylex'
import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '../lib/constants'
import Header from './components/Header'
import Footer from './components/Footer'
import { typography } from './styles/site'
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
        <div {...stylex.props(styles.page)}>
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
    boxSizing: 'border-box',
    columnGap: 16,
    display: {
      default: 'flex',
      '@media (min-width: 640px)': 'grid',
    },
    flexDirection: {
      default: 'column',
    },
    gap: {
      default: 24,
      '@media (min-width: 640px)': 0,
    },
    gridTemplateColumns: {
      '@media (min-width: 640px)': 'repeat(8, minmax(0, 1fr))',
    },
    gridTemplateRows: {
      '@media (min-width: 640px)': 'auto 1fr auto',
    },
    marginInline: 'auto',
    minHeight: '100dvh',
    maxWidth: 744,
    paddingBlock: 24,
    paddingInline: {
      default: 24,
      '@media (min-width: 640px)': 32,
    },
    position: 'relative',
    rowGap: {
      '@media (min-width: 640px)': 32,
    },
    width: '100%',
  },
  main: {
    display: 'flex',
    flex: {
      default: 1,
      '@media (min-width: 640px)': 'unset',
    },
    flexDirection: 'column',
    gridColumn: {
      '@media (min-width: 640px)': '1 / -1',
    },
    minHeight: 0,
    minWidth: 0,
    paddingBlockStart: {
      default: 52,
      '@media (min-width: 640px)': 0,
    },
  },
})
