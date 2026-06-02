import { Injectable, InternalServerErrorException } from '@nestjs/common'
import axios from 'axios'
import { envs } from '../config/envs'
import { AnmatService } from './anmat.service'
import { OcrResultDto } from './dto/ocr-result.dto'

@Injectable()
export class OcrService {
	constructor(private readonly anmatService: AnmatService) {}

	async extractText(fileBuffer: Buffer, fileName: string): Promise<OcrResultDto> {
		const formData = new FormData()
		const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'image/jpeg' })
		formData.append('file', blob, fileName)

		try {
			const { data } = await axios.post<OcrResultDto>(`${envs.ocrServiceUrl}/extract`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
				timeout: 60000,
			})

			// Validar cada producto 100% localmente de forma instantánea
			if (data.products && data.products.length > 0) {
				console.log(
					`[OCR VALIDATION] Recibidos ${data.products.length} candidatos de texto del motor OCR.`
				)
				const validatedProducts = await Promise.all(
					data.products.map(async (product) => {
						const rawText = product.text

						console.log(
							`[OCR VALIDATION] Evaluando candidato: "${rawText}" (Confianza OCR: ${(product.confidence * 100).toFixed(1)}%)`
						)

						// Validar en la base de datos local
						const validation = await this.anmatService.validateProduct(rawText)
						if (validation.isApto && validation.score && validation.score >= 70) {
							console.log(
								`[OCR VALIDATION] ¡APROBADO! "${rawText}" coincide con producto apto: "${validation.brand} - ${validation.description}" (Score: ${validation.score}%, RNPA: ${validation.rnpa})`
							)
							return {
								...product,
								text: `${validation.brand} ${validation.description}`, // Reemplazar por nombre oficial limpio
								isApto: true,
								anmatDetails: `RNPA: ${validation.rnpa} - ${validation.brand}`,
								rnpa: validation.rnpa,
								brand: validation.brand,
								description: validation.description,
								score: validation.score,
							}
						}

						// Si no coincide localmente con alta confianza, se descarta (no es apto o es basura)
						console.log(
							`[OCR VALIDATION] DESCARTADO: "${rawText}" no tiene coincidencia apta confiable (Score: ${validation.score ?? 0}%)`
						)
						return null
					})
				)
				// Filtramos los nulos (basura o productos no aptos)
				data.products = validatedProducts.filter((p) => p !== null) as any
				console.log(
					`[OCR VALIDATION] Filtrado completo. Quedaron ${data.products.length} productos aptos validados.`
				)
			}

			return data
		} catch (error) {
			console.error('Error crítico en OcrService (Axios):', error.message)
			if (axios.isAxiosError(error)) {
				console.error('Detalles:', error.response?.data || error.code)
			}
			throw new InternalServerErrorException(
				'No se pudo establecer comunicación estable con el motor de IA.'
			)
		}
	}
}
