import { textSocialImage } from '@/lib/social-image'

export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }

// Keep existing shared image URLs working.
export default async function Image({ params }: { params: Promise<{ title: string; description: string }> }) {
  const { title } = await params
  return textSocialImage(title)
}
