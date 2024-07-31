/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mamuso.dev',
        port: '',
        pathname: '/assets/feed/**',
      },
    ],
  },
}

module.exports = nextConfig
