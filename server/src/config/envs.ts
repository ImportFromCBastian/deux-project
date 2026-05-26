interface EnvConfig {
	port: number
	ocrServiceUrl: string
}

const getEnvs = (): EnvConfig => {
	const ocrServiceUrl = process.env.OCR_SERVICE_URL

	const port = process.env.PORT || process.env.BACKEND_PORT_INTERNAL

	if (!ocrServiceUrl) {
		throw new Error('Falta la variable de entorno: OCR_SERVICE_URL')
	}

	return {
		port: Number(port) || 3000,
		ocrServiceUrl
	}
}

export const envs = getEnvs()
