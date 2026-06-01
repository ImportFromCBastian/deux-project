'use client'

import Image from 'next/image'
import { useCallback, useRef, useState, useEffect } from 'react'
import Webcam from 'react-webcam'
import { analyzeLabel } from '../actions/ocr.action'
import { base64ToBlob, resizeImage } from '@/utils/converter'

interface DetectedProduct {
  text: string
  box: number[] // [x1, y1, x2, y2]
  confidence: number
}

export default function LabelScanner() {
  const webcamRef = useRef<Webcam>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [products, setProducts] = useState<DetectedProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 })

  // Efecto para medir dimensiones reales vs visuales
  useEffect(() => {
    if (containerRef.current && imageSrc) {
      const { clientWidth, clientHeight } = containerRef.current
      setDisplaySize({ width: clientWidth, height: clientHeight })
    }
  }, [imageSrc])

  const videoConstraints = {
    // Usamos una resolución estándar de celular pero dejamos que el sistema elija la mejor
    aspectRatio: 9 / 16,
    facingMode: 'environment',
  }

  const captureAndSend = useCallback(async () => {
    const video = webcamRef.current?.video
    const imageBase64 = webcamRef.current?.getScreenshot()

    if (!imageBase64 || !video) {
      setError('No se pudo acceder a la cámara.')
      return
    }

    // Guardamos las dimensiones REALES de la captura para escalar después
    setNaturalSize({ width: video.videoWidth, height: video.videoHeight })
    setImageSrc(imageBase64)
    setIsLoading(true)
    setError(null)
    setProducts([])

    try {
      // Redimensionamos manteniendo la proporción
      const resizedBase64 = await resizeImage(imageBase64, 1200) 
      const imageBlob = base64ToBlob(resizedBase64)
      const formData = new FormData()
      formData.append('file', imageBlob, 'capture.jpg')

      const result = await analyzeLabel(formData)

      if (result.success && result.products) {
        const uniqueProducts: DetectedProduct[] = []
        const seenTexts = new Set<string>()

        result.products.forEach((p: DetectedProduct) => {
          const normalizedText = p.text.toLowerCase().trim()
          if (!seenTexts.has(normalizedText) && p.text.length > 2) {
            seenTexts.add(normalizedText)
            uniqueProducts.push(p)
          }
        })
        setProducts(uniqueProducts)
      } else {
        setError(result.error ?? 'Error de conexión')
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetScanner = () => {
    setImageSrc(null)
    setProducts([])
    setError(null)
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-white rounded-2xl shadow-lg border border-neutral-100 space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-neutral-800">Escáner de Góndola</h2>
        <p className="text-neutral-500 text-xs">Captura para detectar productos</p>
      </div>

      <div 
        ref={containerRef}
        className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] shadow-inner flex items-center justify-center"
      >
        {imageSrc ? (
          <div className="relative w-full h-full">
            <img
              src={imageSrc}
              alt="Captura"
              className="w-full h-full object-contain" // object-contain evita la deformación
            />
            
            {!isLoading && products.map((product, index) => {
              // ESCALADO MATEMÁTICO PRECISO
              // 1. Calculamos cuánto se redimensionó la imagen en el backend (el backend usa 1200 como maxWidth)
              const scaleToIA = Math.min(1, 1200 / naturalSize.width)
              const iaWidth = naturalSize.width * scaleToIA
              const iaHeight = naturalSize.height * scaleToIA

              // 2. Calculamos la escala entre la imagen de la IA y el display actual
              const scaleX = displaySize.width / iaWidth
              const scaleY = displaySize.height / iaHeight

              const left = product.box[0] * scaleX
              const top = product.box[1] * scaleY
              const width = (product.box[2] - product.box[0]) * scaleX
              const height = (product.box[3] - product.box[1]) * scaleY

              return (
                <div
                  key={`${product.text}-${index}`}
                  className="absolute border-2 border-red-500 bg-red-500/20"
                  style={{
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                  }}
                >
                  <span className="bg-red-600 text-white text-[8px] px-1 absolute -top-4 left-0 whitespace-nowrap">
                    {product.text}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover"
            mirrored={false}
          />
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-xs">Procesando góndola...</span>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        {!imageSrc ? (
          <button
            type="button"
            onClick={captureAndSend}
            className="w-14 h-14 bg-red-500 rounded-full border-4 border-red-200 shadow-xl flex items-center justify-center active:scale-90 transition-transform"
          >
            <div className="w-8 h-8 rounded-full border-2 border-white/20" />
          </button>
        ) : (
          <button
            type="button"
            onClick={resetScanner}
            className="px-6 py-2 bg-neutral-800 text-white text-sm font-bold rounded-full shadow-lg"
          >
            NUEVA CAPTURA
          </button>
        )}
      </div>

      {products.length > 0 && (
        <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
          <p className="text-[10px] font-bold text-neutral-400 uppercase mb-2">Detectados</p>
          <div className="flex flex-wrap gap-1">
            {products.map((p, i) => (
              <span key={i} className="px-2 py-0.5 bg-white border border-neutral-200 rounded text-[10px] text-neutral-600">
                {p.text}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
