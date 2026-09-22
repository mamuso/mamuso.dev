import { Children, isValidElement } from 'react'
import { cacheLife } from 'next/cache'
import type { ComponentProps } from 'react'
import { createHighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'
import * as stylex from '@stylexjs/stylex'
import { colors } from '../styles/tokens.stylex'

// Load a small set of grammars once, only when a code block is rendered.
let highlighter: ReturnType<typeof createHighlighterCore> | undefined

function getHighlighter() {
  return highlighter ??= createHighlighterCore({
    themes: [import('shiki/themes/github-light.mjs')],
    langs: [
      import('shiki/langs/css.mjs'),
      import('shiki/langs/javascript.mjs'),
      import('shiki/langs/typescript.mjs'),
      import('shiki/langs/jsx.mjs'),
      import('shiki/langs/tsx.mjs'),
      import('shiki/langs/html.mjs'),
      import('shiki/langs/json.mjs'),
      import('shiki/langs/bash.mjs'),
    ],
    engine: createOnigurumaEngine(import('shiki/wasm')),
  })
}

async function highlight(code: string, language: string) {
  'use cache'
  cacheLife('max')
  const syntax = await getHighlighter()
  const lang = syntax.getLoadedLanguages().includes(language) ? language : 'text'
  return { lang, tokens: syntax.codeToTokens(code, { lang, theme: 'github-light' }).tokens }
}

export default async function CodeBlock({ children, ...props }: ComponentProps<'pre'>) {
  const child = Children.toArray(children)[0]
  if (!isValidElement<ComponentProps<'code'>>(child) || typeof child.props.children !== 'string') {
    return <pre {...props} {...stylex.props(styles.block)}>{children}</pre>
  }

  const language = child.props.className?.match(/(?:^|\s)lang(?:uage)?-([^\s]+)/)?.[1] ?? 'text'
  const { lang, tokens } = await highlight(child.props.children, language)

  return (
    <pre {...props} {...stylex.props(styles.block)} tabIndex={0} aria-label={`${lang} code`}>
      <code className={child.props.className}>
        {tokens.map((line, lineIndex) => (
          <span key={lineIndex}>
            {line.map((token, tokenIndex) => (
              <span key={tokenIndex} style={{
                color: token.color,
                fontStyle: token.fontStyle && token.fontStyle & 1 ? 'italic' : undefined,
                fontWeight: token.fontStyle && token.fontStyle & 2 ? 700 : undefined,
                textDecoration: token.fontStyle && token.fontStyle & 4 ? 'underline' : undefined,
              }}>{token.content}</span>
            ))}
            {lineIndex < tokens.length - 1 ? '\n' : null}
          </span>
        ))}
      </code>
    </pre>
  )
}

const styles = stylex.create({
  block: {
    backgroundColor: colors.surfaceRaised,
    color: colors.textPrimary,
    borderRadius: 6,
    boxSizing: 'border-box',
    marginBlock: 0,
    maxWidth: '100%',
    minWidth: 0,
    overflowX: 'auto',
    padding: 20,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: 13,
    lineHeight: 1.6,
    tabSize: 2,
    whiteSpace: 'pre',
  },
})
