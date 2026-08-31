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
      <body {...stylex.props(typography.root, styles.body)}>
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
  body: {
    backgroundBlendMode: 'normal, multiply',
    backgroundColor: '#e5e5e5',
    backgroundImage:
      "linear-gradient(rgb(229 229 229 / 85%), rgb(229 229 229 / 85%)), url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbG5zOnN2Z2pzPSJodHRwOi8vc3ZnanMuZGV2L3N2Z2pzIiB2aWV3Qm94PSIwIDAgNzAwIDcwMCIgd2lkdGg9IjcwMCIgaGVpZ2h0PSI3MDAiPjxkZWZzPjxmaWx0ZXIgaWQ9Im5ubm9pc2UtZmlsdGVyIiB4PSItMjAlIiB5PSItMjAlIiB3aWR0aD0iMTQwJSIgaGVpZ2h0PSIxNDAlIiBmaWx0ZXJVbml0cz0ib2JqZWN0Qm91bmRpbmdCb3giIHByaW1pdGl2ZVVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJsaW5lYXJSR0IiPgoJPGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuMTQyIiBudW1PY3RhdmVzPSI0IiBzZWVkPSIxNSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgeD0iMCUiIHk9IjAlIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiByZXN1bHQ9InR1cmJ1bGVuY2UiPjwvZmVUdXJidWxlbmNlPgoJPGZlU3BlY3VsYXJMaWdodGluZyBzdXJmYWNlU2NhbGU9IjE1IiBzcGVjdWxhckNvbnN0YW50PSIwLjc1IiBzcGVjdWxhckV4cG9uZW50PSIyMCIgbGlnaHRpbmctY29sb3I9ImhzbCgyMywgNzglLCA2NyUpIiB4PSIwJSIgeT0iMCUiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGluPSJ0dXJidWxlbmNlIiByZXN1bHQ9InNwZWN1bGFyTGlnaHRpbmciPgogICAgCQk8ZmVEaXN0YW50TGlnaHQgYXppbXV0aD0iMyIgZWxldmF0aW9uPSIxMDAiPjwvZmVEaXN0YW50TGlnaHQ+CiAgCTwvZmVTcGVjdWxhckxpZ2h0aW5nPgogIDxmZUNvbG9yTWF0cml4IHR5cGU9InNhdHVyYXRlIiB2YWx1ZXM9IjAiIHg9IjAlIiB5PSIwJSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgaW49InNwZWN1bGFyTGlnaHRpbmciIHJlc3VsdD0iY29sb3JtYXRyaXgiPjwvZmVDb2xvck1hdHJpeD4KPC9maWx0ZXI+PC9kZWZzPjxyZWN0IHdpZHRoPSI3MDAiIGhlaWdodD0iNzAwIiBmaWxsPSJ0cmFuc3BhcmVudCI+PC9yZWN0PjxyZWN0IHdpZHRoPSI3MDAiIGhlaWdodD0iNzAwIiBmaWxsPSJoc2woMjMsIDc4JSwgNjclKSIgZmlsdGVyPSJ1cmwoI25ubm9pc2UtZmlsdGVyKSI+PC9yZWN0Pjwvc3ZnPg==')",
    backgroundRepeat: 'no-repeat, repeat',
    backgroundSize: 'auto, 20%',
    boxSizing: 'border-box',
    margin: 0,
    minHeight: '100vh',
  },
  page: {
    alignContent: 'start',
    boxSizing: 'border-box',
    columnGap: 16,
    display: 'grid',
    gridTemplateColumns: {
      default: 'repeat(4, minmax(0, 1fr))',
      '@media (min-width: 640px)': 'repeat(8, minmax(0, 1fr))',
    },
    marginInline: 'auto',
    minHeight: '100vh',
    maxWidth: 744,
    paddingBlock: 24,
    paddingInline: {
      default: 16,
      '@media (min-width: 640px)': 32,
    },
    width: '100%',
  },
  main: {
    gridColumn: '1 / -1',
    minWidth: 0,
  },
})
