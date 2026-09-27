import { textSocialImage } from '@/lib/social-image'
import { BLOG_TITLE } from '@/lib/constants'

// Keep existing shared image URLs working; new pages use /og/note, /og/stack or /og/page.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  return textSocialImage(searchParams.get('title') || BLOG_TITLE)
}
