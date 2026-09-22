import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '../styles/site'
import RecentMusic from './RecentMusic'

export default function Footer() {
  return (
    <footer {...stylex.props(layout.fullBleed, styles.footer)}>
      <div {...stylex.props(layout.container, styles.content)}>
        <p {...stylex.props(typography.muted, styles.copy)}>
          mamuso <Link href="https://x.com/mamuso" {...stylex.props(typography.mutedLink)}>x</Link>{' '}
          <Link href="https://github.com/mamuso" {...stylex.props(typography.mutedLink)}>github</Link>
        </p>
        <RecentMusic />
      </div>
    </footer>
  )
}

const styles = stylex.create({
  content: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'space-between',
  },
  footer: {
    gridColumn: '1 / -1',
    position: 'relative',
    zIndex: 1,
  },
  copy: {
    marginBlock: 0,
  },
})
