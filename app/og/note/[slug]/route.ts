import { getPostBySlug, resolvePostSlug } from '@/lib/api'
import { textSocialImage } from '@/lib/social-image'

// Mirrors /note/<slug>; photos have their own route at /og/photo/<slug>.
export async function GET(_request: Request, ctx: RouteContext<'/og/note/[slug]'>) {
  const slug = await resolvePostSlug((await ctx.params).slug)
  if (!slug) return new Response('Not found', { status: 404 })
  const post = await getPostBySlug(slug, ['title', 'category'])
  if (post.category === 'photo') return new Response('Not found', { status: 404 })
  return textSocialImage(post.title)
}
