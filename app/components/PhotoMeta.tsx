import { PostType } from '@/lib/types'

export default function Post({ post }: { post: PostType }) {
  return (
    <section className="post-photometa mono">
      <ul>
        {post.camera && <li>{post.camera}</li>}
        {post.fnumber && <li>ƒ/{post.fnumber}</li>}
        {post.exposureBiasValue && <li>{post.exposureBiasValue}</li>}
        {post.exposureTime && <li>{post.exposureTime}s</li>}
        {post.iso && <li>ISO {post.iso}</li>}
        {post.GPSLatitude && (
          <li className="post-geo">
            {post.GPSLatitude} N {post.GPSLongitude} W
          </li>
        )}
      </ul>
    </section>
  )
}
