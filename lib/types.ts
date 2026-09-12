export interface PhotoExif {
  camera?: string
  iso?: number
  fnumber?: number
  exposureBiasValue?: number
  exposureTime?: string
  GPSLatitude?: number
  GPSLongitude?: number
  colorPalette?: string[]
}
interface BasePost extends PhotoExif {
  title: string
  date: string
  slug: string
  content: string
  summary?: string
  photoStack?: string
  photoStackTitle?: string
  photoStackOrder?: number
}
interface ImageFields { basename: string; width: number; height: number }
export type PhotoPost = BasePost & ImageFields & { category: 'photo' }
export type NotePost = BasePost & { category: 'note' | 'code' } & (
  ImageFields | { basename?: undefined; width?: undefined; height?: undefined }
)
export type PostType = PhotoPost | NotePost

/** Selected keys always exist, but optional content can have an undefined value.
 * K & string keeps this mapping non-homomorphic, preserving undefined values. */
export type SelectedPost<P, K extends keyof P> = P extends unknown ? { [F in K & string]: P[F] } : never
export const POST_DETAIL_FIELDS = ['title', 'date', 'slug', 'content', 'summary', 'category', 'basename', 'camera', 'iso', 'fnumber', 'exposureBiasValue', 'exposureTime', 'GPSLatitude', 'GPSLongitude', 'width', 'height', 'colorPalette'] as const
export type PostDetail = SelectedPost<PostType, typeof POST_DETAIL_FIELDS[number]>
export type PostSummary = Pick<PostType, 'title' | 'date' | 'slug'>
export type PhotoMetadata = Pick<PostDetail, keyof PhotoExif>
