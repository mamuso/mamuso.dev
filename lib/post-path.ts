/** Photos live at /photo/<slug>; every other post, written notes included, at /note/<slug>. */
export function postPath({ slug, category }: { slug: string; category?: string }) {
  return category === 'photo' ? `/photo/${slug}` : `/note/${slug}`
}
