'use client'

import { Images, CodeBlock, Article, Note } from '@phosphor-icons/react'

export { TreeStructure, Robot, Browsers, PencilLine, Package, SketchLogo } from '@phosphor-icons/react'

export function SelectIcon({ category }: { category: string }) {
  switch (category) {
    case 'note':
      return <Note color="var(--text-secondary)" />
    case 'code':
      return <CodeBlock color="var(--text-secondary)" />
    case 'photo':
      return <Images color="var(--text-secondary)" />
    default:
      return <Article color="var(--text-secondary)" />
  }
}
