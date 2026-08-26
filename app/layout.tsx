import Script from 'next/script'
import * as stylex from '@stylexjs/stylex'
import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from '../lib/constants'
import Header from './components/Header'
import Footer from './components/Footer'
import './globals.css'

const platformDetectionScript = `
(() => {
  const root = document.documentElement;
  const userAgent = navigator.userAgent || '';
  const userAgentDataPlatform = navigator.userAgentData?.platform || '';
  const platform = navigator.platform || '';
  const normalizedPlatform = \`\${userAgentDataPlatform} \${platform} \${userAgent}\`.toLowerCase();
  const isApple = /(mac|iphone|ipad|ipod|ios)/.test(normalizedPlatform);
  root.dataset.platform = isApple ? 'apple' : 'non-apple';
  if (!isApple) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = '/fonts/SFPro.woff2';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = '';
    document.head.append(link);
  }
})();
`

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
        <link rel="alternate" type="application/rss+xml" title="mamuso.dev RSS" href={`${BLOG_URL}/feed.xml`}></link>
        <Script id="platform-detection" strategy="beforeInteractive">
          {platformDetectionScript}
        </Script>
      </head>
      <body>
        <div {...stylex.props(styles.page)}>
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}

const styles = stylex.create({
  page: {
    boxSizing: 'border-box',
    marginInline: 'auto',
    paddingBlock: 24,
    paddingInline: {
      default: 24,
      '@media (min-width: 640px)': 32,
    },
    width: '100%',
  },
})
