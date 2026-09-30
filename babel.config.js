const path = require('path')

const dev = process.env.NODE_ENV !== 'production'

module.exports = {
  presets: ['next/babel'],
  plugins: [
    [
      '@stylexjs/babel-plugin',
      {
        dev,
        runtimeInjection: false,
        enableInlinedConditionalMerge: true,
        treeshakeCompensation: true,
        aliases: { '@/*': [path.join(__dirname, '*')] },
        // Turbopack rewrites __dirname to /ROOT/ in the PostCSS worker.
        unstable_moduleResolution: { type: 'commonJS', rootDir: process.cwd() },
      },
    ],
  ],
}
