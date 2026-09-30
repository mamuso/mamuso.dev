import { getPhotoStack } from '@/lib/get-photo-stack'
import { feedPhoto, photoSocialImage } from '@/lib/social-image'

export async function GET(request: Request, ctx: RouteContext<'/og/stack/[stack]'>) {
  const photos = await getPhotoStack((await ctx.params).stack)
  return photoSocialImage(photos[0].photoStackTitle ?? photos[0].title, photos.slice(0, 2).map(photo => feedPhoto(photo, request)))
}
