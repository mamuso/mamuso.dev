import Link from 'next/link'
import * as stylex from '@stylexjs/stylex'
import { typography } from '../styles/site'

export default function Footer() {
  return (
    <footer {...stylex.props(styles.footer)}>
      <p {...stylex.props(typography.muted, styles.copy)}>
        mamuso <Link href="https://x.com/mamuso" {...stylex.props(typography.mutedLink)}>x</Link>{' '}
        <Link href="https://github.com/mamuso" {...stylex.props(typography.mutedLink)}>github</Link>
      </p>
    </footer>
  )
}

const styles = stylex.create({
  footer: {
    gridColumn: {
      '@media (min-width: 640px)': '1 / -1',
    },
    position: 'relative',
    zIndex: 1,
  },
  copy: {
    marginBlock: 0,
  },
})
