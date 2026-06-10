'use client'

import { AlertTriangle, Info, ShieldCheck, Tag, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import { analyzeLabel } from '@/lib/actions/ocr.action'
import { base64ToBlob, resizeImage } from '@/lib/image/converter'

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
  const isLive = true
  const [videoAspect, setVideoAspect] = useState(1)
  const [selectedProduct, setSelectedProduct] =
    useState<DetectedProduct | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const headerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (selectedProduct) {
      // Intentar enfocar inmediatamente
      headerRef.current?.focus()

      // En el próximo frame de animación para asegurar que el DOM esté listo
      const rafId = requestAnimationFrame(() => {
        headerRef.current?.focus()
      })

      // Timeout de respaldo a los 50ms para asegurar que el foco se mantenga en el encabezado
      const timer = setTimeout(() => {
        headerRef.current?.focus()
      }, 50)

      return () => {
        cancelAnimationFrame(rafId)
        clearTimeout(timer)
      }
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

        result.products.forEach((p: Partial<DetectedProduct>) => {
          if (p.isApto) {
            setAnnouncement(
              `Detectado producto apto sin TACC: ${p.brand || ''} ${p.text || ''}`
            )
          }
        })
        setProducts((prev) => {
          const newMap = new Map<string, DetectedProduct>()

          // Mantener detecciones previas para evitar parpadeo y cuidar foco del teclado
          const activeText =
            typeof document !== 'undefined'
              ? document.activeElement
                  ?.getAttribute('data-product-text')
                  ?.toLowerCase()
              : null

          prev.forEach((p) => {
            const key = p.text.toLowerCase()
            const isFocused = activeText === key
            if (isFocused || now - p.lastSeen < 8000) {
              newMap.set(key, p)
            }
          })

          // Mezclar con nuevos resultados de la IA + ANMAT
          result.products.forEach((p: Partial<DetectedProduct>) => {
            const key = p.text?.toLowerCase()
            if (key) {
              newMap.set(key, { ...p, lastSeen: now } as DetectedProduct)
            }
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
    <div className="relative flex-1 w-full h-full bg-background text-foreground flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 z-10 shrink-0">
        <h1 className="text-lg font-bold text-foreground">
          Escáner de Góndola
        </h1>
      </div>

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
          title="Cámara en vivo para escáner de productos"
          aria-label="Cámara en vivo para escaneo de códigos de barra y etiquetas de productos"
          videoConstraints={{
            facingMode: 'environment',
            width: { ideal: 1280 },
          }}
        />

        {/* Overlay IA + ANMAT */}
        {isLive && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
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
              {products.map((product) => {
                const left = product.box[0] * 100
                const top = product.box[1] * 100
                const width = (product.box[2] - product.box[0]) * 100
                const height = (product.box[3] - product.box[1]) * 100

                // El color cambia si ANMAT lo validó
                const colorClass = product.isApto
                  ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] high-contrast:border-green-400 high-contrast:border-[4px]'
                  : 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)] high-contrast:border-yellow-400 high-contrast:border-[4px]'
                const bgClass = product.isApto
                  ? 'bg-green-500 text-white high-contrast:bg-green-500 high-contrast:text-black'
                  : 'bg-red-500 text-white high-contrast:bg-yellow-400 high-contrast:text-black'

                return (
                  <button
                    key={product.text}
                    data-product-text={product.text}
                    type="button"
                    tabIndex={0}
                    className={`absolute border-[2.5px] rounded-lg transition-all duration-300 pointer-events-auto cursor-pointer hover:scale-[1.02] bg-transparent p-0 text-left focus:outline focus:outline-[3px] focus:outline-yellow-400 focus:outline-offset-[3px] focus:ring-0 ${colorClass}`}
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
                      className={`absolute bottom-full left-0 text-xs md:text-sm px-2 py-0.5 font-black whitespace-nowrap rounded-t-md uppercase flex items-center gap-1 pointer-events-auto shadow-md ${bgClass}`}
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
        <div className="p-6 bg-card border-t border-border pb-6">
          <div className="flex flex-wrap gap-2 justify-center max-h-[120px] overflow-y-auto">
            {products.map((p) => (
              <button
                key={p.text}
                data-product-text={p.text}
                type="button"
                tabIndex={0}
                className={`px-3 py-2 rounded-xl border flex flex-col gap-0.5 text-left cursor-pointer focus:outline focus:outline-[3px] focus:outline-green-500 focus:outline-offset-[3px] focus:ring-0 active:scale-95 transition-all ${
                  p.isApto
                    ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'
                    : 'bg-muted/40 border-border hover:bg-muted/80'
                }`}
                onClick={() => setSelectedProduct(p)}
                aria-label={`Ver detalles de ${p.text}`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${p.isApto ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
                    aria-hidden="true"
                  />
                  <span
                    className={`text-xs md:text-sm font-bold ${
                      p.isApto
                        ? 'text-green-700 dark:text-green-400 high-contrast:text-green-400 font-extrabold'
                        : 'text-foreground high-contrast:text-yellow-400 font-extrabold'
                    }`}
                  >
                    {p.text}
                  </span>
                </div>
                {p.isApto && p.anmatDetails && (
                  <span className="text-xs md:text-sm text-green-600/80 dark:text-green-400/80 high-contrast:text-green-300 font-bold tracking-tight pl-3">
                    {p.anmatDetails}
                  </span>
                )}
              </button>
            ))}
            {products.length === 0 && (
              <span className="text-muted-foreground high-contrast:text-yellow-400 text-sm md:text-base font-black animate-pulse force-reduced-motion:animate-none tracking-widest uppercase">
                ESCANEANDO GÓNDOLA...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Product Details Drawer */}
      {selectedProduct && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
          {/* Click outside to close */}
          <button
            type="button"
            tabIndex={-1}
            className="absolute inset-0 w-full h-full bg-transparent cursor-default border-none p-0 focus:outline-none"
            onClick={() => setSelectedProduct(null)}
            aria-label="Cerrar detalles del producto"
          />

          <div
            className="relative w-full max-w-md bg-card border-t border-border rounded-t-3xl p-6 shadow-2xl animate-slide-up flex flex-col gap-4 pointer-events-auto z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
          >
            {/* Handle bar (decorative only) */}
            <div
              className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/30 mb-2"
              aria-hidden="true"
            />

            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${selectedProduct.isApto ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}
                  aria-hidden="true"
                >
                  {selectedProduct.isApto ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>
                <button
                  type="button"
                  ref={headerRef}
                  className="flex flex-col gap-1 text-left bg-transparent border-none p-1 focus:outline focus:outline-[3px] focus:outline-yellow-400 focus:outline-offset-[3px] focus:ring-0 rounded-xl cursor-default w-full"
                  aria-label={`Producto: ${selectedProduct.brand || selectedProduct.text}. Estado: ${selectedProduct.isApto ? 'Apto Sin TACC' : 'No verificado / No Apto'}`}
                >
                  <span
                    id="modal-description"
                    className={`text-xs md:text-sm font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                      selectedProduct.isApto
                        ? 'bg-green-500/10 text-green-700 dark:text-green-400 high-contrast:bg-green-500 high-contrast:text-black font-extrabold'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400 high-contrast:bg-yellow-400 high-contrast:text-black font-extrabold'
                    }`}
                  >
                    {selectedProduct.isApto
                      ? 'Apto Sin TACC'
                      : 'No verificado / No Apto'}
                  </span>
                  <span
                    id="modal-title"
                    className="block text-foreground font-bold text-lg leading-tight mt-1"
                  >
                    {selectedProduct.brand || selectedProduct.text}
                  </span>
                </button>
              </div>
              <button
                type="button"
                ref={closeButtonRef}
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors focus:outline focus:outline-[3px] focus:outline-primary focus:outline-offset-[3px] focus:ring-0"
                aria-label="Cerrar detalles de producto"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <hr className="border-border" />

            {/* Details Content */}
            <div className="flex flex-col gap-3">
              {selectedProduct.description && (
                <div className="flex flex-col gap-1 text-left w-full">
                  <span className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wide">
                    Descripción Oficial (ANMAT)
                  </span>
                  <span className="block text-foreground text-sm leading-relaxed font-medium bg-muted/40 p-3 rounded-xl border border-border w-full text-left">
                    {selectedProduct.description}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 p-3 rounded-xl border border-border flex flex-col gap-1 text-left w-full">
                  <span className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Tag
                      className="w-3 h-3 text-primary shrink-0"
                      aria-hidden="true"
                    />{' '}
                    RNPA
                  </span>
                  <span className="text-foreground font-mono text-sm font-bold tracking-wider">
                    {selectedProduct.rnpa || 'N/A'}
                  </span>
                </div>

                <div className="bg-muted/40 p-3 rounded-xl border border-border flex flex-col gap-1 text-left w-full">
                  <span className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Info
                      className="w-3 h-3 text-primary shrink-0"
                      aria-hidden="true"
                    />{' '}
                    Coincidencia
                  </span>
                  <span className="text-foreground text-sm font-bold">
                    {selectedProduct.score
                      ? `${selectedProduct.score}%`
                      : '100%'}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA/Actions */}
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="mt-2 w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl active:scale-98 transition-all text-sm tracking-wide shadow-lg hover:bg-primary/90 focus:outline focus:outline-[3px] focus:outline-primary focus:outline-offset-[3px] focus:ring-0"
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
