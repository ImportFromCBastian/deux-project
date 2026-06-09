interface EnvConfig {
	port: number
	ocrServiceUrl: string
	geminiApiKey: string
}

const getEnvs = (): EnvConfig => {
	const ocrServiceUrl = process.env.OCR_SERVICE_URL
	const geminiApiKey = process.env.GEMINI_API_KEY

	const port = process.env.PORT || process.env.BACKEND_PORT_INTERNAL

	if (!ocrServiceUrl) {
		throw new Error('Falta la variable de entorno: OCR_SERVICE_URL')
	}

	if (!geminiApiKey) {
		throw new Error('Falta la variable de entorno: GEMINI_API_KEY')
	}

	return {
		port: Number(port) || 3000,
		ocrServiceUrl,
		geminiApiKey,
	}
}

export const envs = getEnvs()
