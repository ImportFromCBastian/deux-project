import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { envs } from '../config/envs'
import { OcrResultDto } from './dto/ocr-result.dto'

@Injectable()
export class OcrService {
	async extractText(fileBuffer: Buffer, fileName: string): Promise<string[]> {
		const formData = new FormData()

		const blob = new Blob([new Uint8Array(fileBuffer)])
		formData.append('file', blob, fileName)

		try {
			const response = await fetch(`${envs.ocrServiceUrl}/extract`, {
				method: 'POST',
				body: formData,
			})

			if (!response.ok) {
				throw new InternalServerErrorException(
					'El microservicio de OCR devolvió una respuesta fallida.'
				)
			}

			const data = (await response.json()) as OcrResultDto

			return data.words ?? []
		} catch (error) {
			console.error('Error crítico en OcrService:', error)
			throw new InternalServerErrorException(
				'No se pudo establecer comunicación con el motor de IA de Python.'
			)
		}
	}
}
