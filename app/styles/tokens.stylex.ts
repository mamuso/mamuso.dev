import * as stylex from '@stylexjs/stylex'

export const colors = stylex.defineVars({
  textPrimary: '#18181b',
  textMuted: '#62626a',
})

export const type = stylex.defineVars({
  family: 'var(--font-body)',
  size: '15px',
  lineHeight: '1.5',
  weightRegular: 400,
  weightMedium: 500,
})
