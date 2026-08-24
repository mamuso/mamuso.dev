/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
