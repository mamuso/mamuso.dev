import { getPostBySlug, resolvePostSlug } from '@/lib/api'
import { feedPhoto, photoSocialImage } from '@/lib/social-image'

export async function GET(request: Request, ctx: RouteContext<'/og/photo/[slug]'>) {
  const slug = await resolvePostSlug((await ctx.params).slug)
  if (!slug) return new Response('Not found', { status: 404 })
  const post = await getPostBySlug(slug, ['title', 'category', 'basename', 'width', 'height'])
  if (post.category !== 'photo' || !post.basename) return new Response('Not found', { status: 404 })
  return photoSocialImage(post.title, [feedPhoto(post, request)])
}
