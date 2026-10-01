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
      default: colors.textFaint,
      [stylex.when.ancestor(':hover', homeLink)]: colors.textSubtle,
      [stylex.when.ancestor(':focus-visible', homeLink)]: colors.textSubtle,
    },
    transitionProperty: 'color',
    transitionDuration: { default: '140ms', '@media (prefers-reduced-motion: reduce)': '0ms' },
    transitionTimingFunction: 'ease',
  },
})
