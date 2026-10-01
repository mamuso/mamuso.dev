import * as stylex from '@stylexjs/stylex'

const introReveal = stylex.keyframes({
  from: {
    filter: 'blur(1.5px)',
    opacity: 0,
  },
  to: {
    filter: 'blur(0)',
    opacity: 1,
  },
})

/** Word-by-word blur reveal shared by the homepage intro and its random fact. */
export const reveal = stylex.create({
  word: {
    animationDuration: {
      default: '700ms',
      '@media (prefers-reduced-motion: reduce)': '0ms',
    },
    animationFillMode: 'backwards',
    animationName: {
      default: introReveal,
      '@media (prefers-reduced-motion: reduce)': 'none',
    },
    // A gentle curve, not the site's expo-out: the blur reveal needs its
    // motion spread across the whole duration to survive load-time frame drops.
    animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  delay: (delay: string) => ({ animationDelay: delay }),
})
