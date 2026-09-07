import PhotoViewerImage from '@/app/components/PhotoViewerImage'
import { notFound } from 'next/navigation'
import { getPostBySlug, resolvePostSlug } from '@/lib/api'
import PhotoQuickLook from '@/app/components/PhotoQuickLook'

export default async function PhotoViewer({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const canonical = resolvePostSlug(slug)
  if (!canonical) notFound()
  const post = getPostBySlug(canonical, ['title', 'slug', 'date', 'category', 'basename', 'width', 'height'])
  if (post.category !== 'photo' || !post.basename) notFound()
  return (
    <PhotoQuickLook title={post.title} href={`/note/${post.slug}`}>
      <PhotoViewerImage basename={post.basename} width={post.width} height={post.height} title={post.title} />
    </PhotoQuickLook>
  )
}
