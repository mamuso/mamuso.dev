import { editorialYear } from './editorial-date'
import type { PostSummary } from './types'

export function groupNoteYears(posts: PostSummary[]) {
  const groups = new Map<number, PostSummary[]>([[2025, []], [2024, []]])
  for (const post of posts) {
    const year = editorialYear(post.date)
    const group = groups.get(year) ?? []
    group.push(post)
    groups.set(year, group)
  }
  return [...groups.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, notes]) => ({ year, notes }))
}
