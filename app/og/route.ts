import { textSocialImage } from '@/lib/social-image'
import { BLOG_TITLE, BLOG_SUBTITLE } from '@/lib/constants'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  return textSocialImage(searchParams.get('title') || BLOG_TITLE, searchParams.get('description') || BLOG_SUBTITLE)
}
