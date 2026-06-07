'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import Webcam from 'react-webcam'
import { analyzeLabel } from '@/lib/actions/ocr.action'
import { base64ToBlob, resizeImage } from '@/lib/image/converter'
import { X, ShieldCheck, AlertTriangle, Tag, Info } from 'lucide-react'

interface DetectedProduct {
  text: string
  box: number[] // [x1, y1, x2, y2] - Normalizados
  confidence: number
  lastSeen: number
  isApto?: boolean
  anmatDetails?: string
  rnpa?: string
  brand?: string
  description?: string
  score?: number
}

export default function RealTimeScanner() {
  const webcamRef = useRef<Webcam>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef<number | undefined>(undefined)
  const isScanning = useRef(false)

  const [products, setProducts] = useState<DetectedProduct[]>([])
  const [isLive, setIsLive] = useState(true)
  const [videoAspect, setVideoAspect] = useState(1)
  const [selectedProduct, setSelectedProduct] =
    useState<DetectedProduct | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (selectedProduct) {
      setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 150)
    }
  }, [selectedProduct])

  const processFrame = useCallback(async () => {
    if (!isScanning.current || !webcamRef.current) return

    const video = webcamRef.current.video
    if (!video || video.readyState !== 4) {
      requestRef.current = requestAnimationFrame(processFrame)
      return
    }

    if (videoAspect !== video.videoWidth / video.videoHeight) {
      setVideoAspect(video.videoWidth / video.videoHeight)
    }

    const imageBase64 = webcamRef.current.getScreenshot()
    if (!imageBase64) {
      requestRef.current = requestAnimationFrame(processFrame)
      return
    }

    try {
      const resizedBase64 = await resizeImage(imageBase64, 1000)
      const imageBlob = base64ToBlob(resizedBase64)
      const formData = new FormData()
      formData.append('file', imageBlob, 'frame.jpg')

      const result = await analyzeLabel(formData)

      if (result.success && result.products) {
        const now = Date.now()

        result.products.forEach((p: any) => {
          if (p.isApto) {
            setAnnouncement(
              `Detectado producto apto sin TACC: ${p.brand || ''} ${p.text || ''}`
            )
          }
        })
        setProducts((prev) => {
          const newMap = new Map<string, DetectedProduct>()

          // Mantener detecciones previas para evitar parpadeo
          prev.forEach((p) => {
            if (now - p.lastSeen < 2000) newMap.set(p.text.toLowerCase(), p)
          })

          // Mezclar con nuevos resultados de la IA + ANMAT
          result.products.forEach((p: any) => {
            const key = p.text.toLowerCase()
            newMap.set(key, { ...p, lastSeen: now })
          })

          return Array.from(newMap.values())
        })
      }
    } catch (err) {
      console.error('OCR Error:', err)
    }

    if (isScanning.current) {
      setTimeout(() => {
        requestRef.current = requestAnimationFrame(processFrame)
      }, 1000)
    }
  }, [videoAspect])

  // Iniciar el escáner automáticamente cuando se monta el componente
  useEffect(() => {
    isScanning.current = true
    processFrame()
    return () => {
      isScanning.current = false
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [processFrame])

  return (
    <div className="relative flex-1 w-full h-full bg-black flex flex-col font-sans overflow-hidden">
      {/* Estilos inline para animaciones premium del drawer */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `,
        }}
      />

      {/* Visor */}
      <div
        ref={containerRef}
        className="relative flex-1 flex items-center justify-center bg-black"
      >
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="max-w-full max-h-full object-contain"
          videoConstraints={{
            facingMode: 'environment',
            width: { ideal: 1280 },
          }}
        />

        {/* Overlay IA + ANMAT */}
        {isLive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="relative"
              style={{
                aspectRatio: `${videoAspect}`,
                width:
                  videoAspect >
                  (containerRef.current?.clientWidth || 1) /
                    (containerRef.current?.clientHeight || 1)
                    ? '100%'
                    : 'auto',
                height:
                  videoAspect >
                  (containerRef.current?.clientWidth || 1) /
                    (containerRef.current?.clientHeight || 1)
                    ? 'auto'
                    : '100%',
              }}
            >
              {products.map((product, index) => {
                const left = product.box[0] * 100
                const top = product.box[1] * 100
                const width = (product.box[2] - product.box[0]) * 100
                const height = (product.box[3] - product.box[1]) * 100

                // El color cambia si ANMAT lo validó
                const colorClass = product.isApto
                  ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]'
                  : 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                const bgClass = product.isApto ? 'bg-green-500' : 'bg-red-500'

                return (
                  <button
                    key={`${product.text}-${index}`}
                    className={`absolute border-[2.5px] rounded-lg transition-all duration-300 pointer-events-auto cursor-pointer hover:scale-[1.02] bg-transparent p-0 text-left focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:outline-none ${colorClass}`}
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                    }}
                    onClick={() => setSelectedProduct(product)}
                    aria-label={`${product.isApto ? 'Producto apto sin TACC' : 'Producto no verificado'}: ${product.text}. Presione Enter para ver datos oficiales.`}
                  >
                    <div
                      className={`absolute -top-7 left-0 text-white text-[10px] px-2 py-0.5 font-black whitespace-nowrap rounded-t-md uppercase flex items-center gap-1 ${bgClass}`}
                    >
                      {product.isApto && <span aria-hidden="true">✅</span>}
                      {product.text}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Resultados Footer */}
      {isLive && (
        <div className="p-6 bg-neutral-950 border-t border-white/5 pb-6">
          <div className="flex flex-wrap gap-2 justify-center max-h-[120px] overflow-y-auto">
            {products.map((p, i) => (
              <button
                key={i}
                className={`px-3 py-2 rounded-xl border flex flex-col gap-0.5 text-left cursor-pointer hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none active:scale-95 transition-all ${p.isApto ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}
                onClick={() => setSelectedProduct(p)}
                aria-label={`Ver detalles de ${p.text}`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${p.isApto ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
                    aria-hidden="true"
                  />
                  <span
                    className={`text-[10px] font-bold ${p.isApto ? 'text-green-400' : 'text-white'}`}
                  >
                    {p.text}
                  </span>
                </div>
                {p.isApto && p.anmatDetails && (
                  <span className="text-[7px] text-green-500/60 font-medium tracking-tight pl-3">
                    {p.anmatDetails}
                  </span>
                )}
              </button>
            ))}
            {products.length === 0 && (
              <span className="text-white/20 text-[9px] font-bold animate-pulse tracking-widest">
                ANALIZANDO GÓNDOLA...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Product Details Drawer */}
      {selectedProduct && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
          {/* Click outside to close */}
          <div
            className="absolute inset-0"
            onClick={() => setSelectedProduct(null)}
          />

          <div
            className="relative w-full max-w-md bg-neutral-900 border-t border-white/10 rounded-t-3xl p-6 shadow-2xl animate-slide-up flex flex-col gap-4 pointer-events-auto z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
          >
            {/* Handle bar (decorative only) */}
            <div
              className="mx-auto w-12 h-1.5 rounded-full bg-white/20 mb-2"
              aria-hidden="true"
            />

            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${selectedProduct.isApto ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                  aria-hidden="true"
                >
                  {selectedProduct.isApto ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <span
                    id="modal-description"
                    className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${selectedProduct.isApto ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                  >
                    {selectedProduct.isApto
                      ? 'Apto Sin TACC'
                      : 'No verificado / No Apto'}
                  </span>
                  <h2
                    id="modal-title"
                    className="text-white font-bold text-lg leading-tight mt-1"
                  >
                    {selectedProduct.brand || selectedProduct.text}
                  </h2>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                aria-label="Cerrar detalles de producto"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <hr className="border-white/5" />

            {/* Details Content */}
            <div className="flex flex-col gap-3">
              {selectedProduct.description && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide">
                    Descripción Oficial (ANMAT)
                  </span>
                  <p className="text-white/80 text-sm leading-relaxed font-medium bg-white/5 p-3 rounded-xl border border-white/5">
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide flex items-center gap-1">
                    <Tag className="w-3 h-3" /> RNPA
                  </span>
                  <span className="text-white font-mono text-sm font-bold tracking-wider">
                    {selectedProduct.rnpa || 'N/A'}
                  </span>
                </div>

                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide flex items-center gap-1">
                    <Info className="w-3 h-3" /> Coincidencia
                  </span>
                  <span className="text-white text-sm font-bold">
                    {selectedProduct.score
                      ? `${selectedProduct.score}%`
                      : '100%'}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA/Actions */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="mt-2 w-full py-3 bg-white text-black font-bold rounded-xl active:scale-98 transition-all text-sm tracking-wide shadow-lg shadow-white/5 hover:bg-neutral-100"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Región de lectura de pantalla invisible pero accesible por voz */}
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {announcement}
      </div>
    </div>
  )
}
