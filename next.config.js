/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
