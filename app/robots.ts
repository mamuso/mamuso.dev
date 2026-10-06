import type { MetadataRoute } from 'next'
import { BLOG_URL } from '@/lib/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${BLOG_URL}/sitemap.xml`,
  }
}
