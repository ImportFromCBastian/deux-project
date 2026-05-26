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

    console.log('Respuesta de NestJS:', response)

    if (!response.ok) {
      return {
        success: false,
        error: 'El motor de IA no pudo procesar la etiqueta',
      }
    }

    const data = await response.json()

    return { success: true, words: data.words }
  } catch (error) {
    console.error('Error en Next.js al contactar con NestJS:', error)
    return {
      success: false,
      error: 'El servicio de escaneo no está disponible',
    }
  }
}
