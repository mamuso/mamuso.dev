/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
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
