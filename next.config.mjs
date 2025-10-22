/** @type {import('next').NextConfig} */
const nextConfig = {
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

  webpack: (config, { dev, isServer }) => {
    if (dev && isServer) {
      config.optimization = config.optimization || {}
      config.optimization.splitChunks = false
    }
    return config
  },

  // Production-specific settings
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
    productionBrowserSourceMaps: false,
  }),
}

export default nextConfig
