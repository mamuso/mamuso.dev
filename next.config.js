/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/posts/1',
      },
    ]
  },
}

module.exports = nextConfig
