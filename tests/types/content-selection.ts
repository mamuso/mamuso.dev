import { getPostBySlug, getPhotoPosts, getNotePosts } from '../../lib/api'
import type { PostDetail } from '../../lib/types'

// Compile-time contracts: tsc fails if an expected error stops being an error.
function contentSelectionContracts() {
  const summary = getPostBySlug('example', ['title', 'slug'])
  const title: string = summary.title
  // @ts-expect-error content was not selected
  summary.content
  // @ts-expect-error even optional metadata is unavailable unless selected
  summary.camera
  // @ts-expect-error unknown fields cannot be requested
  getPostBySlug('example', ['image'])
  // @ts-expect-error a summary cannot satisfy a full-post component
  const detail: PostDetail = summary
  const photos = getPhotoPosts(['width', 'iso'])
  const width: number = photos[0].width
  const iso: number | undefined = photos[0].iso
  // @ts-expect-error EXIF numbers are not strings
  const wrongIso: string = photos[0].iso
  const note = getNotePosts(['basename', 'width'])[0]
  // @ts-expect-error notes do not necessarily contain images
  const missingWidth: number = note.width
  if (note.basename) { const imageWidth: number = note.width; void imageWidth }
  const selected = getPostBySlug('example', ['category', 'width'])
  if (selected.category === 'photo') { const photoWidth: number = selected.width; void photoWidth }
  void [title, detail, width, iso, wrongIso, missingWidth]
}
void contentSelectionContracts
