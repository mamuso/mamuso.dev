/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  // Keep the existing navigation/prefetch behavior during the Next 16.4 upgrade.
  partialPrefetching: false,
  // Static photos are deployed separately; verification artifacts are local only.
  outputFileTracingExcludes: {
    '/*': [
      './content/assets/**/*', './public/assets/**/*', './output/**/*',
      './test-results/**/*', './playwright-report/**/*', './.playwright-cli/**/*',
      './.agents/**/artifacts/**/*',
    ],
  },
  turbopack: {
    rules: {
      '*.wgsl': {
        loaders: ['@vgpu/wgsl/loader-webpack'],
        as: '*.js',
      },
    },
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.wgsl$/,
      loader: '@vgpu/wgsl/loader-webpack',
    })
    return config
  },
  async redirects() {
    return [
      {
        source: '/notes/:page(\\d+)',
        destination: '/notes',
        permanent: true,
      },
      {
        source: '/note/allpress-coffee-tokyo',
        destination: '/note/allpress-espresso-tokyo-2',
        permanent: true,
      },
      {
        source: '/posts/:path*',
        destination: '/notes/:path*',
        permanent: true,
      },
      {
        source: '/post/:slug',
        destination: '/note/:slug',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
