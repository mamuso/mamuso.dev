import { textSocialImage } from '@/lib/social-image'

// Pages without a post of their own, such as /notes and /photos.
export async function GET(_request: Request, ctx: RouteContext<'/og/page/[title]'>) {
  return textSocialImage((await ctx.params).title)
}
