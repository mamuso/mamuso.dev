import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import * as stylexPlugin from '@stylexjs/eslint-plugin'
import stylistic from '@stylistic/eslint-plugin'

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    plugins: {
      '@stylexjs': stylexPlugin,
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: 'always' }],
      '@stylistic/jsx-quotes': ['error', 'prefer-double'],
      '@stylexjs/no-conflicting-props': 'error',
      '@stylexjs/no-unused': 'error',
      '@stylexjs/valid-styles': 'error',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },
]

export default eslintConfig
