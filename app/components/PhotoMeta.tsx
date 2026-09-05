import { PostType } from '@/lib/types'
import * as stylex from '@stylexjs/stylex'
import { layout, typography } from '../styles/site'

export default function PhotoMeta({ post }: { post: PostType }) {
  return (
    <ul {...stylex.props(layout.list, typography.muted, styles.metadata)}>
      {post.colorPalette && <li>Colors: {post.colorPalette.join(', ')}</li>}
      {post.camera && <li>{post.camera}</li>}
      {post.fnumber && <li>ƒ/{post.fnumber}</li>}
      {post.exposureBiasValue && <li>{post.exposureBiasValue}</li>}
      {post.exposureTime && <li>{post.exposureTime}s</li>}
      {post.iso && <li>ISO {post.iso}</li>}
      {post.GPSLatitude && (
        <li>
          {post.GPSLatitude} {post.GPSLongitude}
        </li>
      )}
    </ul>
  )
}

const styles = stylex.create({
  metadata: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    marginBlock: 16,
  },
})
