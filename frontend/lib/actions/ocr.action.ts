'use server'

export async function analyzeLabel(formData: FormData) {
  const file = formData.get('file') as File

  if (!file || file.size === 0) {
    return { success: false, error: 'No se detectó ninguna imagen válida' }
  }

  const apiUrl = process.env.INTERNAL_API_URL

  if (!apiUrl) {
    throw new Error('Falta configuración de INTERNAL_API_URL en el entorno')
  }

  try {
    const response = await fetch(`${apiUrl}/ocr/extract`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error del backend:', response.status, errorText)
      return {
        success: false,
        error: `El motor de IA respondió con error ${response.status}.`,
      }
    }

    const data = await response.json()
    return { success: true, products: data.products }
  } catch (error: any) {
    console.error('Error detallado en Next.js:', error)
    return {
      success: false,
      error: `Error de conexión: ${error.message || 'No se pudo contactar al servidor'}`,
    }
  }
}
