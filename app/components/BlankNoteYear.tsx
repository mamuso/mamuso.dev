import * as stylex from '@stylexjs/stylex'

export default function BlankNoteYear({ year }: { year: number }) {
  return (
    <div {...stylex.props(styles.row)}>
      <span {...stylex.props(styles.label)}>Intentionally left blank</span>
      <time dateTime={String(year)}>{year}</time>
    </div>
  )
}

const styles = stylex.create({
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingBlock: 5,
    fontSize: 16,
    fontWeight: 400,
    lineHeight: '22px',
    letterSpacing: '-0.005em',
    color: 'rgba(23, 24, 27, 0.4)',
  },
  label: {
    fontStyle: 'italic',
  },
})
