import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import * as stylexPlugin from '@stylexjs/eslint-plugin'

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    plugins: {
      '@stylexjs': stylexPlugin,
    },
    rules: {
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
