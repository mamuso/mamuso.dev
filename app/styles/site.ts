import * as stylex from '@stylexjs/stylex'
import { colors, type } from './tokens.stylex'

/**
 * The shared type roles intentionally stay small. Gavin Nelson's hierarchy is
 * built from one text size, two weights, and color—not a conventional type ramp.
 */
export const typography = stylex.create({
  root: {
    color: colors.textPrimary,
    fontFamily: type.family,
    fontSize: type.size,
    fontWeight: type.weightRegular,
    lineHeight: type.lineHeight,
  },
  heading: {
    color: colors.textPrimary,
    fontSize: 'inherit',
    fontWeight: type.weightMedium,
    lineHeight: 'inherit',
    marginBlock: 0,
  },
  muted: {
    color: colors.textMuted,
  },
  link: {
    color: {
      default: colors.textPrimary,
      ':hover': colors.textMuted,
    },
    textDecorationLine: {
      default: 'none',
      ':focus-visible': 'underline',
    },
    textUnderlineOffset: 3,
  },
  mutedLink: {
    color: {
      default: colors.textMuted,
      ':hover': colors.textPrimary,
    },
    textDecorationLine: {
      default: 'none',
      ':focus-visible': 'underline',
    },
    textUnderlineOffset: 3,
  },
})

export const layout = stylex.create({
  container: {
    boxSizing: 'border-box',
    marginInline: 'auto',
    maxWidth: 1080,
    paddingInline: {
      default: 24,
      '@media (min-width: 640px)': 60,
    },
    width: '100%',
  },
  fullBleed: {
    marginInline: 'calc(50% - 50vw)',
    width: '100vw',
  },
  section: {
    marginBlockStart: 48,
  },
  list: {
    listStyle: 'none',
    marginBlock: 0,
    paddingInline: 0,
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
})
