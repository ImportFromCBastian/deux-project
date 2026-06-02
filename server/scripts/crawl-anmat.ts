import axios from 'axios'
import * as cheerio from 'cheerio'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = 'https://listadoalg.anmat.gob.ar/Home/Index'

interface Product {
	rnpa: string
	brand: string
	description: string
	rne: string
}

async function getInitialStates() {
	const { data } = await axios.get(BASE_URL)
	const $ = cheerio.load(data)
	return {
		viewState: $('#__VIEWSTATE').val() as string,
		viewStateGen: $('#__VIEWSTATEGENERATOR').val() as string,
		eventValidation: $('#__EVENTVALIDATION').val() as string,
	}
}

async function fetchPage(
	pageNumber: number,
	states: { viewState: string; viewStateGen: string; eventValidation: string }
): Promise<{ products: Product[]; nextStates: typeof states; totalPages: number }> {
	const formData = new URLSearchParams()
	formData.append('__VIEWSTATE', states.viewState)
	formData.append('__VIEWSTATEGENERATOR', states.viewStateGen)
	formData.append('__EVENTVALIDATION', states.eventValidation)
	formData.append('ctl00$ContentPlaceHolder1$ddEstado', '1') // VIGENTES

	// Si es la página 1, simulamos la búsqueda inicial con marca vacía
	if (pageNumber === 1) {
		formData.append('ctl00$ContentPlaceHolder1$cmdBuscar', 'Buscar')
	} else {
		// Para páginas subsiguientes en ASP.NET GridView
		formData.append('__EVENTTARGET', 'ctl00$ContentPlaceHolder1$GridView1')
		formData.append('__EVENTARGUMENT', `Page$${pageNumber}`)
	}

	const { data } = await axios.post(BASE_URL, formData, {
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
	})

	const $ = cheerio.load(data)
	const products: Product[] = []

	// Parseamos la tabla
	const rows = $('#ctl00_ContentPlaceHolder1_GridView1 tr').not(':first-child')
	rows.each((_, row) => {
		const cells = $(row).find('td')
		if (cells.length >= 4) {
			const rnpa = $(cells[0]).text().trim()
			const brand = $(cells[1]).text().trim().toUpperCase()
			const description = $(cells[3]).text().trim().toUpperCase()
			const rne = $(cells[2]).text().trim()

			if (rnpa && brand) {
				products.push({ rnpa, brand, description, rne })
			}
		}
	})

	// Extraer nuevos estados para la siguiente página
	const nextStates = {
		viewState: $('#__VIEWSTATE').val() as string,
		viewStateGen: $('#__VIEWSTATEGENERATOR').val() as string,
		eventValidation: $('#__EVENTVALIDATION').val() as string,
	}

	// Deducir total de páginas desde el paginador
	let totalPages = 1
	const pagerRow = $('#ctl00_ContentPlaceHolder1_GridView1 tr').last()
	const pageLinks = pagerRow.find('a')
	if (pageLinks.length > 0) {
		const lastPageLink = pageLinks.last().text().trim()
		const match = lastPageLink.match(/\d+/)
		if (match) {
			totalPages = Math.max(totalPages, parseInt(match[0], 10))
		}
	}

	return { products, nextStates, totalPages }
}

async function startCrawling() {
	console.log('Iniciando extracción completa del listado de la ANMAT...')
	try {
		let states = await getInitialStates()
		let currentPage = 1
		let allProducts: Product[] = []

		// Hacemos la primera página para obtener el total
		console.log(`Extrayendo Página ${currentPage}...`)
		const firstPageResult = await fetchPage(currentPage, states)
		allProducts = allProducts.concat(firstPageResult.products)
		states = firstPageResult.nextStates

		const totalPages = firstPageResult.totalPages
		console.log(
			`Total de páginas detectadas: ${totalPages} (Aproximadamente ${totalPages * 15} productos)`
		)

		currentPage++
		while (currentPage <= totalPages) {
			console.log(`Extrayendo Página ${currentPage}/${totalPages}...`)
			// Añadimos una pequeña pausa de 500ms para ser respetuosos con el servidor de ANMAT
			await new Promise((resolve) => setTimeout(resolve, 500))

			const result = await fetchPage(currentPage, states)
			allProducts = allProducts.concat(result.products)
			states = result.nextStates
			currentPage++
		}

		const dataDir = path.join(__dirname, '..', 'data')
		if (!fs.existsSync(dataDir)) {
			fs.mkdirSync(dataDir, { recursive: true })
		}

		const outputPath = path.join(dataDir, 'anmat_celiac_catalog.json')
		fs.writeFileSync(outputPath, JSON.stringify(allProducts, null, 2), 'utf-8')
		console.log(
			`¡Extracción completada con éxito! Se guardaron ${allProducts.length} productos en ${outputPath}`
		)
	} catch (error) {
		console.error('Error durante la extracción:', error.message)
	}
}

startCrawling()
