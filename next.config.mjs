/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },

  experimental: {
    serverActions: {
      // Get allowed origins from environment or use defaults
      allowedOrigins: process.env.APP_DOMAIN
        ? [`*.${process.env.APP_DOMAIN}`, process.env.APP_DOMAIN]
        : ['*.yourdomain.com', 'localhost:3000'],
    },
  },

  // Disable telemetry in production
  ...(process.env.NODE_ENV === 'production' && {
    productionBrowserSourceMaps: false,
  }),
}

export default nextConfig

