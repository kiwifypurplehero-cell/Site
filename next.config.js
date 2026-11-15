/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'porsche-placeholder.example.com',
      },
    ],
  },
  experimental: {
    turbo: {
      resolveAlias: {
        '@/*': './src/*',
      },
    },
  },
}

module.exports = nextConfig