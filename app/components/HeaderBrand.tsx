'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as stylex from '@stylexjs/stylex'
import { typography } from '../styles/site'

export default function HeaderBrand() {
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <h1 {...stylex.props(typography.heading, styles.interactive, isHome && styles.home)}>
      <Link
        href="/"
        aria-label={isHome ? 'Home' : undefined}
        {...stylex.props(typography.link, styles.brand)}
      >
        <Image
          src="/images/logo.svg"
          width={24}
          height={24}
          alt=""
          aria-hidden="true"
          {...stylex.props(!isHome && styles.mutedLogo)}
        />
        {isHome ? null : 'mamuso'}
      </Link>
    </h1>
  )
}

const styles = stylex.create({
  interactive: {
    pointerEvents: 'auto',
  },
  home: {
    paddingBlockStart: {
      default: 0,
      '@media (min-width: 720px)': 76,
    },
  },
  brand: {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
  },
  mutedLogo: {
    opacity: 0.65,
  },
})
