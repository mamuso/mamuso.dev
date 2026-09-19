import * as stylex from '@stylexjs/stylex'

// The lossless pigment masks are generated offline and shared by every photo.
export default function PaletteDab({ color, variant, rotation }: { color: string; variant: number; rotation: number }) {
  return (
    <span title={color} {...stylex.props(styles.dab)}>
      <span role="img" aria-label={color} {...stylex.props(styles.pigment, styles.appearance(color, variant, rotation))} />
    </span>
  )
}

const styles = stylex.create({
  dab: { display: 'inline-flex', width: 29, height: 48, justifyContent: 'center', flexShrink: 0, opacity: 0.95 },
  pigment: {
    display: 'block', width: 34, height: 34, flexShrink: 0, alignSelf: 'flex-end',
    maskSize: '100% 100%', maskRepeat: 'no-repeat', maskMode: 'alpha',
  },
  appearance: (color: string, variant: number, degrees: number) => ({
    backgroundColor: color,
    maskImage: `url(/textures/palette/crayon-${variant}.png)`,
    transform: `rotate(${degrees}deg)`,
  }),
})
