export type PostCategory = 'photo' | 'note' | 'code'

export interface Post {
  title: string
  date: string
  slug: string
  content: string
  summary?: string
  category?: PostCategory
  basename?: string
  camera?: string
  iso?: number
  fnumber?: number
  exposureBiasValue?: number
  exposureTime?: string
  GPSLatitude?: number
  GPSLongitude?: number
  width?: number
  height?: number
  colorPalette?: string[]
}

export type PostFrontmatter = Omit<Post, 'slug' | 'content'>
