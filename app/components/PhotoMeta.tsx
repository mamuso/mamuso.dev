import type { Post } from '@/lib/types'

type PhotoMetadata = Pick<
  Post,
  | 'colorPalette'
  | 'camera'
  | 'fnumber'
  | 'exposureBiasValue'
  | 'exposureTime'
  | 'iso'
  | 'GPSLatitude'
  | 'GPSLongitude'
>

export default function PhotoMeta({ post }: { post: PhotoMetadata }) {
  return (
    <ul>
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
