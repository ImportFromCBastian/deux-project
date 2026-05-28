'use client'

import Image from 'next/image'
import { useCallback, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import { analyzeLabel } from '../actions/ocr.action'
import { base64ToBlob, resizeImage } from '@/utils/converter'


export default function LabelScanner() {
  const webcamRef = useRef<Webcam>(null)

  const [words, setWords] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  // Configuramos la cámara para que intente usar la trasera por defecto
  const videoConstraints = {
    width: 720,
    height: 1280,
    facingMode: 'environment',
  }

  const captureAndSend = useCallback(async () => {
    // 1. Capturamos la imagen en Base64
    const imageBase64 = webcamRef.current?.getScreenshot()

    if (!imageBase64) {
      setError('No se pudo capturar la imagen de la cámara')
      return
    }

    // Mostramos la foto congelada y preparamos la UI
    setImageSrc(imageBase64)
    setIsLoading(true)
    setError(null)
    setWords([])

    try {
      // 2. Convertimos el Base64 a binario para que NestJS sea feliz
      const resizedBase64 = await resizeImage(imageBase64, 800)
      const imageBlob = base64ToBlob(resizedBase64)
      const formData = new FormData()

      // Le damos un nombre ficticio al archivo
      formData.append('file', imageBlob, 'capture.jpg')

      // 3. Enviamos el binario al Server Action
      const result = await analyzeLabel(formData)

      if (result.success && result.words) {
        setWords(result.words)
      } else {
        setError(result.error ?? 'Ocurrió un error inesperado al escanear')
      }
    } catch (_) {
      setError('Error crítico al procesar la imagen')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetScanner = () => {
    setImageSrc(null)
    setWords([])
    setError(null)
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-sm border border-neutral-100 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-neutral-800">Escáner en Vivo</h2>
        <p className="text-neutral-500 text-sm">
          Enfoca la etiqueta y presiona escanear
        </p>
      </div>

      {/* Contenedor de la Cámara o de la Foto Capturada */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-3/4 shadow-inner flex items-center justify-center">
        {imageSrc ? (
          // Muestra la foto congelada que acabamos de tomar
          <Image
            src={imageSrc}
            alt="Captura"
            className="w-full h-full object-cover opacity-90"
            width={720}
            height={1280}
          />
        ) : (
          // Muestra la cámara en vivo
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover"
            mirrored={false}
          />
        )}

        {/* Indicador de carga superpuesto */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center space-y-3 animate-pulse">
            <span className="text-4xl">⚙️</span>
            <span className="text-white font-medium text-sm tracking-wide">
              Analizando IA...
            </span>
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="flex justify-center pt-2">
        {!imageSrc ? (
          <button
            type="button"
            onClick={captureAndSend}
            className="w-16 h-16 bg-blue-500 rounded-full border-4 border-blue-200 hover:bg-blue-600 active:scale-95 transition-all shadow-md flex items-center justify-center"
            aria-label="Tomar foto"
          >
            <div className="w-12 h-12 rounded-full border-2 border-white/50" />
          </button>
        ) : (
          <button
            type="button"
            onClick={resetScanner}
            disabled={isLoading}
            className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            Volver a Escanear
          </button>
        )}
      </div>

      {/* Manejo de Errores */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl text-center font-medium border border-red-100 animate-in fade-in">
          {error}
        </div>
      )}

      {/* Resultados */}
      {words.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 border-t border-neutral-100 pt-6">
          <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider text-center">
            Texto Detectado
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {words.map((word, index) => (
              <span
                key={`${word}-${index}`}
                className="px-3 py-1.5 bg-green-50 text-green-800 rounded-lg text-sm font-medium border border-green-200 shadow-sm"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
