import * as stylex from '@stylexjs/stylex'

export const colors = stylex.defineVars({
  textPrimary: '#18181b',
  textMuted: '#62626a',
  rule: '#ADADAD',
  ruleSoft: '#d4d4d8',
  quote: '#a1a1aa',
  surface: '#ffffff',
  placeholder: '#e4e4e9',
})

export const type = stylex.defineVars({
  family: 'var(--font-body)',
  size: '15px',
  sizeCaption: '12px',
  sizeSmall: '13px',
  sizeDisplay: '24px',
  lineHeight: '1.5',
  lineHeightDisplay: '1.2',
  trackingDisplay: '-0.015em',
  weightRegular: 400,
  weightMedium: 500,
})

export const motion = stylex.defineVars({
  easeOut: 'var(--ease-out)',
  easeInOut: 'var(--ease-in-out)',
  durationFast: 'var(--duration-fast)',
  durationBase: 'var(--duration-base)',
})
