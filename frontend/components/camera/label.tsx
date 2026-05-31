'use client'

import { ScanLine, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import Webcam from 'react-webcam'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface LabelCameraProps {
  onCancel: () => void
}

export default function LabelCamera({ onCancel }: LabelCameraProps) {
  const webcamRef = useRef<Webcam>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const captureAndScan = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setIsProcessing(true)

      // TODO: Aquí enviaremos imageSrc a tu ocr.action.ts
      setTimeout(() => {
        setIsProcessing(false)
        console.log('Escaneo completado')
      }, 2000)
    }
  }, [])

  return (
    <>
      {/* Visor de la Cámara Activa */}
      <div className="relative flex-1 px-4 py-2 flex items-center justify-center overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="relative w-full h-full max-h-[60vh] rounded-2xl overflow-hidden ring-2 ring-slate-800 bg-black">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'environment' }}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Botonera de Acción */}
      <div className="p-4 z-10">
        <Card className="bg-background/95 backdrop-blur border-border p-4 shadow-2xl flex flex-col gap-4 rounded-2xl animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-4 rounded-xl border-border bg-background text-foreground"
              onClick={onCancel}
              disabled={isProcessing}
              aria-label="Cancelar Escaneo"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </Button>

            <Button
              size="lg"
              className="flex-1 font-semibold rounded-xl shadow-md h-14 text-base"
              onClick={captureAndScan}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2 animate-pulse">
                  <ScanLine className="w-5 h-5 animate-spin" /> Analizando...
                </span>
              ) : (
                'Escanear Etiqueta'
              )}
            </Button>
          </div>
        </Card>
      </div>
    </>
  )
}
