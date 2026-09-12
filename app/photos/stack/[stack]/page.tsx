import PhotoDetail from '@/app/components/PhotoDetail'
import { pageMetadata, photoSocialImage } from '@/lib/metadata'
import { getPhotoPosts } from '@/lib/api'
import { getPhotoStack } from '@/lib/get-photo-stack'
import { BLOG_TITLE } from '@/lib/constants'

type Props = { params: Promise<{ stack: string }> }

export function generateStaticParams() {
  return [...new Set(getPhotoPosts(['photoStack']).map((photo) => photo.photoStack).filter(Boolean))]
    .map((stack) => ({ stack }))
}

export async function generateMetadata({ params }: Props) {
  const { stack } = await params
  const photos = getPhotoStack(stack)
  const cover = photos[0]
  const title = cover.photoStackTitle ?? cover.title
  return pageMetadata({
    title: `${title} – Photos – ${BLOG_TITLE}`,
    path: `/photos/stack/${encodeURIComponent(stack)}`,
    description: `${title} — ${photos.length} photos by Mamuso.`,
    image: photoSocialImage(cover.basename, title),
  })
}

export default async function PhotoCollection({ params }: Props) {
  const { stack } = await params
  const photos = getPhotoStack(stack)
  return <PhotoDetail title={photos[0].photoStackTitle ?? photos[0].title} photos={photos} linkPhotos />
}
