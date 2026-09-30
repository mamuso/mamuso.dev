import * as stylex from '@stylexjs/stylex'

import { homeLink } from './homeLink.stylex'
import { colors } from './tokens.stylex'

export const homeLinks = stylex.create({
  primary: {
    color: { default: colors.textPrimary, ':hover': colors.textPrimary },
    textDecorationLine: { default: 'none', ':focus-visible': 'underline' },
    textUnderlineOffset: 3,
  },
  secondary: {
    color: {
      default: 'rgba(23, 24, 27, 0.4)',
      [stylex.when.ancestor(':hover', homeLink)]: 'rgba(23, 24, 27, 0.6)',
      [stylex.when.ancestor(':focus-visible', homeLink)]: 'rgba(23, 24, 27, 0.6)',
    },
    transitionProperty: 'color',
    transitionDuration: { default: '140ms', '@media (prefers-reduced-motion: reduce)': '0ms' },
    transitionTimingFunction: 'ease',
  },
})
