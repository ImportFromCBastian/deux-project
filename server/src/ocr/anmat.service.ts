import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import * as cheerio from 'cheerio'
import * as fuzz from 'fuzzball'

export interface AnmatValidation {
	isApto: boolean
	brand?: string
	description?: string
	rnpa?: string
	score?: number
}

@Injectable()
export class AnmatService {
	private readonly logger = new Logger(AnmatService.name)
	private readonly baseUrl = 'https://listadoalg.anmat.gob.ar/Home/Index'
	private cache = new Map<string, AnmatValidation>()

	async validateProduct(text: string): Promise<AnmatValidation> {
		const query = text.trim().toUpperCase()
		if (this.cache.has(query)) {
			return this.cache.get(query)!
		}

		try {
			// 1. Obtener estados de ASP.NET
			const { data: htmlInitial } = await axios.get(this.baseUrl)
			const $ = cheerio.load(htmlInitial)

			const viewState = $('#__VIEWSTATE').val() as string
			const viewStateGen = $('#__VIEWSTATEGENERATOR').val() as string
			const eventValidation = $('#__EVENTVALIDATION').val() as string

			// 2. Búsqueda oficial
			const formData = new URLSearchParams()
			formData.append('__VIEWSTATE', viewState)
			formData.append('__VIEWSTATEGENERATOR', viewStateGen)
			formData.append('__EVENTVALIDATION', eventValidation)
			formData.append('ctl00$ContentPlaceHolder1$txtMarcaFantasia', query)
			formData.append('ctl00$ContentPlaceHolder1$ddEstado', '1') // VIGENTES
			formData.append('ctl00$ContentPlaceHolder1$cmdBuscar', 'Buscar')

			const { data: htmlResults } = await axios.post(this.baseUrl, formData, {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			})

			// 3. Parsear con Fuzzy Matching
			const result = this.parseResultsWithFuzzy(htmlResults, query)
			this.cache.set(query, result)
			return result
		} catch (error) {
			this.logger.error(`Error ANMAT "${query}": ${error.message}`)
			return { isApto: false }
		}
	}

	private parseResultsWithFuzzy(html: string, query: string): AnmatValidation {
		const $ = cheerio.load(html)
		const rows = $('#ctl00_ContentPlaceHolder1_GridView1 tr').not(':first-child')

		let bestMatch: AnmatValidation = { isApto: false }
		let maxScore = 0

		rows.each((_, row) => {
			const cells = $(row).find('td')
			const rnpa = $(cells[0]).text().trim()
			const brand = $(cells[1]).text().trim().toUpperCase()
			const description = $(cells[3]).text().trim().toUpperCase()

			// ESTRATEGIA DE MATCHING ROBUSTA:
			// 1. token_set_ratio: Ignora orden y palabras duplicadas (ideal para "CROPPERS SALADO" vs "CROPPERSMANÍ SALADO")
			const scoreBrand = fuzz.token_set_ratio(query, brand)
			const scoreDesc = fuzz.token_set_ratio(query, description)
			
			// 2. partial_ratio: Por si la IA leyó solo un pedazo del nombre largo oficial
			const partialScore = fuzz.partial_ratio(query, `${brand} ${description}`)

			const currentScore = Math.max(scoreBrand, scoreDesc, partialScore)

			// Si el score es > 70% (bajamos un poco para ser más permisivos con OCR imperfecto)
			if (currentScore > 70 && currentScore > maxScore) {
				maxScore = currentScore
				bestMatch = {
					isApto: true,
					rnpa,
					brand,
					description,
					score: currentScore,
				}
			}
		})

		return bestMatch
	}
}
