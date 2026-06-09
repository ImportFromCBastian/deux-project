import type { NextConfig } from 'next'

const allowedDevOrigins = [
  'pretense-trolling-sedative.ngrok-free.dev',
  process.env.NGROK_TUNNEL,
].filter(Boolean) as string[]

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:3001/:path*',
      },
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
}

export default nextConfig
