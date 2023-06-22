export interface Post {
  title: string
  date: string
  slug: string
  image: {
    format: string
    width: number
    height: number
  }
  content: string
  summary: string
  category: string
}
