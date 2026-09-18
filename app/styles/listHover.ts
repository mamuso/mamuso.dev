import * as stylex from '@stylexjs/stylex'
import { homeLink } from './homeLink.stylex'

export const listHover = stylex.create({
  row: {
    position: 'relative',
    overflow: 'hidden',
    paddingInlineStart: {
      default: 0,
      '@media (hover: hover)': { ':hover': 24 },
      ':focus-visible': 24,
    },
    transitionProperty: 'padding-inline-start',
    transitionDuration: { default: '300ms', '@media (prefers-reduced-motion: reduce)': '0ms' },
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  square: {
    position: 'absolute',
    insetInlineStart: 0,
    insetBlockStart: 9,
    width: 14,
    height: 14,
    backgroundColor: '#17181B',
    pointerEvents: 'none',
    transform: {
      default: 'translateX(-24px)',
      '@media (hover: hover)': {
        [stylex.when.ancestor(':hover', homeLink)]: 'translateX(0)',
      },
      [stylex.when.ancestor(':focus-visible', homeLink)]: 'translateX(0)',
    },
    transitionProperty: 'transform',
    transitionDuration: { default: '300ms', '@media (prefers-reduced-motion: reduce)': '0ms' },
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
})
