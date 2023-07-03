'use client'

import { Images, CodeBlock, Article, NoteBlank } from '@phosphor-icons/react'

export function SelectIcon({ category }: { category: string }) {
  switch (category) {
    case 'note':
      return <NoteBlank color="var(--text-light)" />
    case 'code':
      return <CodeBlock color="var(--text-light)" />
    case 'photo':
      return <Images color="var(--text-light)" />
    default:
      return <Article color="var(--text-light)" />
  }
}
