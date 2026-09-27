import { getPostBySlug, resolvePostSlug } from '@/lib/api'
import { feedPhoto, photoSocialImage, textSocialImage } from '@/lib/social-image'

// Mirrors /note/<slug>: photo posts get the photo cartridge, every other note the notes one.
export async function GET(request: Request, ctx: RouteContext<'/og/note/[slug]'>) {
  const slug = await resolvePostSlug((await ctx.params).slug)
  if (!slug) return new Response('Not found', { status: 404 })
  const post = await getPostBySlug(slug, ['title', 'category', 'basename', 'width', 'height'])
  if (post.category === 'photo' && post.basename) return photoSocialImage(post.title, [feedPhoto(post, request)])
  return textSocialImage(post.title)
}
