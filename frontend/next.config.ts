import type { NextConfig } from 'next'
import { envs } from './config/envs'

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: [envs.ngrokTunnelUrl || ''],
}

export default nextConfig
