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
			const { data } = await axios.post<OcrResultDto>(
				`${envs.ocrServiceUrl}/extract`,
				formData,
				{
					headers: { 'Content-Type': 'multipart/form-data' },
					timeout: 60000,
				}
			)

			// Validar cada producto contra ANMAT (usando el caché interno del servicio)
			if (data.products) {
				const validatedProducts = await Promise.all(
					data.products.map(async (product) => {
						// Solo consultamos si el texto parece un nombre de producto real (> 3 caracteres)
						if (product.text.length > 3) {
							const validation = await this.anmatService.validateProduct(product.text)
							return {
								...product,
								isApto: validation.isApto,
								anmatDetails: validation.isApto
									? `RNPA: ${validation.rnpa} - ${validation.brand}`
									: undefined,
							}
						}
						return product
					})
				)
				data.products = validatedProducts
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
