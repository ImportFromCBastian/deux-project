import * as fs from 'node:fs'
import * as path from 'node:path'
import { Injectable, Logger } from '@nestjs/common'
import * as fuzz from 'fuzzball'

export interface AnmatValidation {
	isApto: boolean
	brand?: string
	description?: string
	rnpa?: string
	score?: number
}

interface Product {
	rnpa: string
	brand: string
	description: string
	rne: string
}

@Injectable()
export class AnmatService {
	private readonly logger = new Logger(AnmatService.name)
	private cache = new Map<string, AnmatValidation>()
	private catalog: Product[] = []
	private celiacVocabulary = new Set<string>()
	private recentMatches: Array<{
		rnpa: string
		brand: string
		description: string
		normalizedBrand: string
		normalizedDescription: string
		timestamp: number
	}> = []

	// Stop words comunes a ignorar para el filtro de vocabulario
	private readonly stopWords = new Set([
		'CON',
		'SIN',
		'TACC',
		'DEL',
		'LOS',
		'LAS',
		'PARA',
		'LIBRE',
		'GLUTEN',
		'NETO',
		'CONT',
		'CONTNETO',
		'ESTA',
		'ESTE',
		'ESTOS',
		'COMO',
		'UNA',
		'UNO',
		'UNOS',
		'POR',
		'MAS',
		'MÁS',
	])

	constructor() {
		this.loadLocalCatalog()
		this.watchCatalogFile()
	}

	private watchCatalogFile() {
		const dataDir = path.join(process.cwd(), 'data')
		try {
			if (!fs.existsSync(dataDir)) {
				fs.mkdirSync(dataDir, { recursive: true })
			}
			fs.watch(dataDir, (eventType, filename) => {
				if (filename === 'anmat_celiac_catalog.json') {
					this.logger.log(
						`Cambio detectado en el catálogo local (disco, evento: ${eventType}). Recargando catálogo y vocabulario...`
					)
					// Un pequeño retraso para asegurar que el archivo terminó de escribirse
					setTimeout(() => {
						this.loadLocalCatalog()
						// Limpiar caché para volver a evaluar con el nuevo catálogo
						this.cache.clear()
					}, 200)
				}
			})
		} catch (e) {
			this.logger.warn(`No se pudo iniciar el watcher del directorio de datos: ${e.message}`)
		}
	}

	private normalizeText(text: string): string {
		if (!text) return ''
		return text
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '') // Remueve acentos
			.replace(/[\n\r]/g, ' ') // Reemplaza saltos de línea con espacios
			.toUpperCase()
			.trim()
	}

	private loadLocalCatalog() {
		try {
			const filePath = path.join(process.cwd(), 'data', 'anmat_celiac_catalog.json')
			if (fs.existsSync(filePath)) {
				const rawData = fs.readFileSync(filePath, 'utf-8')
				const rawCatalog = JSON.parse(rawData)

				// 1. Obtener todas las marcas registradas conocidas (que no sean "NO REGISTRA")
				const knownBrands = new Set<string>()
				for (const prod of rawCatalog) {
					if (prod.brand && prod.brand !== 'NO REGISTRA') {
						const normB = this.normalizeText(prod.brand)
						if (normB) knownBrands.add(normB)
					}
				}

				// 2. Pre-normalizar los datos del catálogo para búsquedas rápidas
				this.catalog = rawCatalog.map((prod: any) => {
					const normalizedBrandOriginal = this.normalizeText(prod.brand)
					const normalizedDescriptionOriginal = this.normalizeText(prod.description)
					const normalizedFantasyOriginal = this.normalizeText(prod.fantasyName)

					let finalBrand = normalizedBrandOriginal
					let finalDescription = normalizedDescriptionOriginal

					// Si la marca es "NO REGISTRA", intentamos deducirla de fantasyName
					if (
						normalizedBrandOriginal === 'NO REGISTRA' &&
						normalizedFantasyOriginal &&
						normalizedFantasyOriginal !== 'NO REGISTRA'
					) {
						// Separar por guión para identificar marca/descripción
						const parts = normalizedFantasyOriginal
							.split('-')
							.map((p) => p.trim())
							.filter(Boolean)

						if (parts.length > 1) {
							// Buscar si alguna parte es una marca conocida
							let foundBrandIndex = -1
							for (let i = 0; i < parts.length; i++) {
								if (knownBrands.has(parts[i])) {
									foundBrandIndex = i
									break
								}
							}

							if (foundBrandIndex !== -1) {
								finalBrand = parts[foundBrandIndex]
								finalDescription = parts.filter((_, idx) => idx !== foundBrandIndex).join(' ')
							} else {
								// Asumir la parte más corta como marca y la más larga como descripción
								let shortestIdx = 0
								let shortestLen = parts[0].length
								for (let i = 1; i < parts.length; i++) {
									if (parts[i].length < shortestLen) {
										shortestLen = parts[i].length
										shortestIdx = i
									}
								}
								finalBrand = parts[shortestIdx]
								finalDescription = parts.filter((_, idx) => idx !== shortestIdx).join(' ')
							}
						} else {
							// Si no hay guión, ver si alguna palabra de fantasyName es marca conocida
							const words = normalizedFantasyOriginal.split(/\s+/)
							let foundBrandWord = ''
							for (const w of words) {
								if (knownBrands.has(w)) {
									foundBrandWord = w
									break
								}
							}

							if (foundBrandWord) {
								finalBrand = foundBrandWord
								finalDescription = normalizedFantasyOriginal
							} else {
								// Usar la última palabra como marca
								if (words.length > 1) {
									finalBrand = words[words.length - 1]
									finalDescription = normalizedFantasyOriginal
								} else {
									finalBrand = normalizedFantasyOriginal
								}
							}
						}

						// Mantener también la descripción original
						if (normalizedDescriptionOriginal && normalizedDescriptionOriginal !== 'NO REGISTRA') {
							finalDescription = `${finalDescription} ${normalizedDescriptionOriginal}`.trim()
						}
					}

					// Asegurar que fantasyName esté en finalDescription si no lo está ya
					if (
						normalizedFantasyOriginal &&
						normalizedFantasyOriginal !== 'NO REGISTRA' &&
						!finalDescription.includes(normalizedFantasyOriginal)
					) {
						finalDescription = `${normalizedFantasyOriginal} ${finalDescription}`.trim()
					}

					return {
						...prod,
						normalizedBrand: finalBrand,
						normalizedDescription: finalDescription,
						normalizedFantasyName: normalizedFantasyOriginal,
					}
				})

				this.logger.log(
					`Catálogo ANMAT local cargado con éxito: ${this.catalog.length} productos (pre-normalizados).`
				)
				this.buildVocabulary()
			} else {
				this.logger.warn(`No se encontró catálogo ANMAT local en ${filePath}.`)
			}
		} catch (error) {
			this.logger.error(`Error cargando catálogo ANMAT local: ${error.message}`)
		}
	}

	private buildVocabulary() {
		this.celiacVocabulary.clear()
		for (const prod of this.catalog) {
			const cBrand = (prod as any).normalizedBrand || ''
			const cDesc = (prod as any).normalizedDescription || ''

			// Palabras significativas de la marca
			if (cBrand !== 'NO REGISTRA') {
				const brandWords = cBrand.split(/[\s',./-]+/)
				for (const w of brandWords) {
					const cleanW = w.trim()
					if (
						cleanW.length > 2 &&
						!this.stopWords.has(cleanW) &&
						!/^\d+$/.test(cleanW) &&
						cleanW !== 'REGISTRA'
					) {
						this.celiacVocabulary.add(cleanW)
					}
				}
			}
			// Palabras significativas de la descripción
			const descWords = cDesc.split(/[\s',./-]+/)
			for (const w of descWords) {
				const cleanW = w.trim()
				if (cleanW.length > 2 && !this.stopWords.has(cleanW) && !/^\d+$/.test(cleanW)) {
					this.celiacVocabulary.add(cleanW)
				}
			}
		}
		this.logger.log(
			`Vocabulario celíaco local indexado: ${this.celiacVocabulary.size} palabras clave únicas.`
		)
	}

	async validateProduct(text: string): Promise<AnmatValidation> {
		const query = text.trim().toUpperCase()
		if (this.cache.has(query)) {
			const cached = this.cache.get(query)!
			if (cached.isApto) {
				return cached
			}
		}

		// Buscar en la memoria a corto plazo para evitar parpadeos (flickering) del escáner
		const now = Date.now()
		this.recentMatches = this.recentMatches.filter((m) => now - m.timestamp < 6000)

		const queryWords = this.normalizeText(query)
			.split(/[\s',./-]+/)
			.map((w) => w.trim())
			.filter((w) => w.length > 3 && !this.stopWords.has(w))

		if (queryWords.length > 0) {
			for (const match of this.recentMatches) {
				const matchesAll = queryWords.every(
					(word) =>
						match.normalizedBrand.includes(word) || match.normalizedDescription.includes(word)
				)
				if (matchesAll) {
					match.timestamp = now
					const result = {
						isApto: true,
						rnpa: match.rnpa,
						brand: match.brand,
						description: match.description,
						score: 100,
					}
					this.logger.log(
						`[RECENT MATCH MEMORY] Reusando coincidencia de memoria reciente para "${query}" -> "${result.brand} - ${result.description}"`
					)
					this.cache.set(query, result)
					return result
				}
			}
		}

		this.logger.log(`[DEBUG] Recibido para validar en ANMAT local: "${query}"`)

		// Validación 100% local en base de datos
		const result = this.validateProductLocal(query)
		if (result.isApto && result.score) {
			this.logger.log(
				`[LOCAL MATCH ${result.score}%] "${query}" -> "${result.brand} - ${result.description}"`
			)

			// Guardar en la memoria a corto plazo para reusar en lecturas incompletas subsecuentes
			const matchItem = {
				rnpa: result.rnpa!,
				brand: result.brand!,
				description: result.description!,
				normalizedBrand: this.normalizeText(result.brand!),
				normalizedDescription: this.normalizeText(result.description!),
				timestamp: now,
			}
			if (!this.recentMatches.some((m) => m.rnpa === matchItem.rnpa)) {
				this.recentMatches.push(matchItem)
			}
		}

		this.cache.set(query, result)
		return result
	}

	private validateProductLocal(query: string): AnmatValidation {
		if (this.catalog.length === 0) {
			this.logger.warn(`[DEBUG] El catálogo está vacío! No se puede validar localmente.`)
			return { isApto: false }
		}

		// Normalizar consulta
		const normalizedQuery = this.normalizeText(query)

		// FILTRADO RÁPIDO DE VOCABULARIO (Inverted Index Bloom Filter)
		const queryWords = normalizedQuery
			.split(/[\s',./-]+/)
			.map((w) => w.trim())
			.filter((w) => w.length > 2 && !this.stopWords.has(w))

		const matchedVocab = queryWords.filter((word) => this.celiacVocabulary.has(word))
		this.logger.log(
			`[DEBUG] Palabras extraídas (normalizadas): [${queryWords.join(', ')}]. Coinciden con vocabulario celiaco: [${matchedVocab.join(', ')}]`
		)

		const hasVocabularyMatch = queryWords.some((word) => this.celiacVocabulary.has(word))
		if (!hasVocabularyMatch) {
			this.logger.log(
				`[DEBUG] RECHAZADO: Ninguna palabra coincide con el vocabulario celíaco indexado.`
			)
			return { isApto: false }
		}

		// Pre-filtrado por palabras clave rápidas
		let candidates = this.catalog.filter((prod: any) => {
			return queryWords.some(
				(word) =>
					(prod.normalizedBrand.includes(word) && prod.normalizedBrand !== 'NO REGISTRA') ||
					prod.normalizedDescription.includes(word)
			)
		})
		if (candidates.length === 0) {
			candidates = this.catalog
		}

		this.logger.log(`[DEBUG] Candidatos pre-filtrados encontrados: ${candidates.length}`)

		let bestMatch: AnmatValidation = { isApto: false }
		let maxScore = 0

		for (const prod of candidates) {
			const nBrand = (prod as any).normalizedBrand
			const nDesc = (prod as any).normalizedDescription

			// REGLA ESTRICTA 1: Verificación de Marca (Brand Verification)
			// Al menos una palabra de la marca registrada DEBE estar en el OCR
			const brandWords =
				nBrand === 'NO REGISTRA'
					? []
					: nBrand
							.split(/[\s'-]+/)
							.filter(
								(w: string) =>
									w.length > 2 &&
									w !== 'SIN' &&
									w !== 'CON' &&
									w !== 'DEL' &&
									w !== 'LOS' &&
									w !== 'REGISTRA'
							)

			if (brandWords.length > 0) {
				const brandMatches = brandWords.some((word: string) => {
					return normalizedQuery.includes(word) || fuzz.partial_ratio(word, normalizedQuery) >= 85
				})
				if (!brandMatches) {
					continue // DESCARTAR: La marca no está presente
				}
			}

			// REGLA ESTRICTA 2: Similitud Combinada de Frase Completa
			const fullSortScore = fuzz.token_sort_ratio(normalizedQuery, `${nBrand} ${nDesc}`)
			const setScoreBrand = fuzz.token_set_ratio(normalizedQuery, nBrand)
			const setScoreDesc = fuzz.token_set_ratio(normalizedQuery, nDesc)
			const fullSetScore = fuzz.token_set_ratio(normalizedQuery, `${nBrand} ${nDesc}`)

			// Combinamos token sort ratio, token set ratio de marca y descripción,
			// y la similitud set global (con un leve factor de escala) para tolerar palabras adicionales leídas por error (como 'SWORIAS', 'VOS')
			const currentScore = Math.max(
				fullSortScore,
				Math.min(setScoreBrand, setScoreDesc),
				fullSetScore * 0.95
			)

			if (currentScore > 74 && currentScore > maxScore) {
				maxScore = currentScore
				bestMatch = {
					isApto: true,
					rnpa: prod.rnpa,
					brand: prod.brand === 'NO REGISTRA' ? nBrand : prod.brand,
					description: prod.brand === 'NO REGISTRA' ? nDesc : prod.description,
					score: Math.round(currentScore),
				}
			}
		}

		if (bestMatch.isApto) {
			this.logger.log(
				`[DEBUG] MEJOR COINCIDENCIA LOCAL: "${normalizedQuery}" -> "${bestMatch.brand} ${bestMatch.description}" (Score: ${bestMatch.score}%)`
			)
		} else {
			this.logger.log(
				`[DEBUG] Ninguna coincidencia local superó el umbral del 75% para "${normalizedQuery}" (Mejor score: ${Math.round(maxScore)}%)`
			)
		}

		return bestMatch
	}
}
