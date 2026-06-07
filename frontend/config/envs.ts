interface EnvConfig {
  ngrokTunnelUrl: string
}

const getEnvs = (): EnvConfig => {
  const ngrokTunnelUrl = process.env.NGROK_TUNNEL || 'http://localhost:3000'
  return {
    ngrokTunnelUrl
  }
}

export const envs = getEnvs()
