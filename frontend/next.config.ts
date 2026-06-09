import type { NextConfig } from 'next'
import { envs } from './config/envs'

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: [envs.ngrokTunnelUrl],
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
}

export default nextConfig
