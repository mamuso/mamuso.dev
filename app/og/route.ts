import { textSocialImage } from '@/lib/social-image'
import { BLOG_TITLE } from '@/lib/constants'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  return textSocialImage(searchParams.get('title') || BLOG_TITLE)
}
