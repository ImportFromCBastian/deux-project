'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import Webcam from 'react-webcam'
import { analyzeLabel } from '../actions/ocr.action'
import { base64ToBlob, resizeImage } from '@/utils/converter'

interface DetectedProduct {
  text: string
  box: number[] // [x1, y1, x2, y2] - Normalizados
  confidence: number
  lastSeen: number
  isApto?: boolean
  anmatDetails?: string
}

export default function RealTimeScanner() {
  const webcamRef = useRef<Webcam>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef<number>()
  const isScanning = useRef(false)

  const [products, setProducts] = useState<DetectedProduct[]>([])
  const [isLive, setIsLive] = useState(false)
  const [videoAspect, setVideoAspect] = useState(1)

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
        setProducts(prev => {
          const newMap = new Map<string, DetectedProduct>()
          
          // Mantener detecciones previas para evitar parpadeo
          prev.forEach(p => { 
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

  const toggleScanner = () => {
    if (isLive) {
      isScanning.current = false
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
      setProducts([])
    } else {
      isScanning.current = true
      processFrame()
    }
    setIsLive(!isLive)
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col font-sans overflow-hidden">
      
      {/* Header */}
      <div className="absolute top-0 inset-x-0 z-30 p-8 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
        <div>
            <h1 className="text-white font-black text-2xl tracking-tight">CELIAPP <span className="text-red-500">PRO</span></h1>
            <p className="text-white/40 text-[8px] font-bold uppercase tracking-[0.2em] mt-1">
                {isLive ? '🔴 Buscando Sin TACC' : '⚪ Sistema listo'}
            </p>
        </div>
        {isLive && (
            <button onClick={toggleScanner} className="bg-red-500/20 text-red-500 text-[10px] font-black px-4 py-2 rounded-full border border-red-500/30 active:scale-90 transition-all">
                DETENER
            </button>
        )}
      </div>

      {/* Visor */}
      <div ref={containerRef} className="relative flex-1 flex items-center justify-center bg-black">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="max-w-full max-h-full object-contain"
          videoConstraints={{ facingMode: 'environment', width: { ideal: 1280 } }}
        />

        {/* Overlay IA + ANMAT */}
        {isLive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div 
                    className="relative"
                    style={{
                        aspectRatio: `${videoAspect}`,
                        width: videoAspect > (containerRef.current?.clientWidth || 1) / (containerRef.current?.clientHeight || 1) ? '100%' : 'auto',
                        height: videoAspect > (containerRef.current?.clientWidth || 1) / (containerRef.current?.clientHeight || 1) ? 'auto' : '100%',
                    }}
                >
                    {products.map((product, index) => {
                        const left = product.box[0] * 100
                        const top = product.box[1] * 100
                        const width = (product.box[2] - product.box[0]) * 100
                        const height = (product.box[3] - product.box[1]) * 100

                        // El color cambia si ANMAT lo validó
                        const colorClass = product.isApto ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                        const bgClass = product.isApto ? 'bg-green-500' : 'bg-red-500'

                        return (
                            <div
                                key={`${product.text}-${index}`}
                                className={`absolute border-[2.5px] rounded-lg transition-all duration-500 ${colorClass}`}
                                style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
                            >
                                <div className={`absolute -top-6 left-0 text-white text-[7px] px-1.5 py-0.5 font-black whitespace-nowrap rounded-t-md uppercase flex items-center gap-1 ${bgClass}`}>
                                    {product.isApto && <span>✅</span>}
                                    {product.text}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}

        {!isLive && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <button 
              onClick={toggleScanner}
              className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all"
            >
              <span className="text-4xl font-bold">START</span>
            </button>
          </div>
        )}
      </div>

      {/* Resultados Footer */}
      {isLive && (
        <div className="p-6 bg-neutral-950 border-t border-white/5 pb-10">
            <div className="flex flex-wrap gap-2 justify-center max-h-[120px] overflow-y-auto">
                {products.map((p, i) => (
                    <div key={i} className={`px-3 py-2 rounded-xl border flex flex-col gap-0.5 ${p.isApto ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${p.isApto ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className={`text-[10px] font-bold ${p.isApto ? 'text-green-400' : 'text-white'}`}>{p.text}</span>
                        </div>
                        {p.isApto && p.anmatDetails && (
                            <span className="text-[7px] text-green-500/60 font-medium tracking-tight pl-3">{p.anmatDetails}</span>
                        )}
                    </div>
                ))}
                {products.length === 0 && (
                    <span className="text-white/20 text-[9px] font-bold animate-pulse tracking-widest">ANALIZANDO GÓNDOLA...</span>
                )}
            </div>
        </div>
      )}
    </div>
  )
}
