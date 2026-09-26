import type { Metadata } from 'next'
import * as stylex from '@stylexjs/stylex'
import OgCartridge from './OgCartridge'

export const metadata: Metadata = {
  title: 'GitHub cartridge – OG base',
  robots: { index: false, follow: false },
}

export default function OgBasePage() {
  return (
    <div data-og-base role="img" aria-label="GitHub cartridge, front view" {...stylex.props(styles.stage)}>
      <OgCartridge />
    </div>
  )
}

const styles = stylex.create({
  stage: {
    width: '100%',
    height: '100dvh',
    overflow: 'hidden',
    display: 'grid',
    placeItems: 'center',
    backgroundColor: 'var(--app-background)',
  },
})
