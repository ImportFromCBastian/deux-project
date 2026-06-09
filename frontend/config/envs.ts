interface EnvConfig {
  ngrokTunnelUrl: string
}

const getEnvs = (): EnvConfig => {
  const ngrokTunnelUrl = process.env.NGROK_TUNNEL

  if (!ngrokTunnelUrl) {
    throw new Error('Falta la variable de entorno: NGROK_TUNNEL')
  }

  return {
    ngrokTunnelUrl,
  }
}

export const envs = getEnvs()
