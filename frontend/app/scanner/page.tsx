'use client'

import { Camera, Info } from 'lucide-react'
import { useState } from 'react'
import LabelCamera from '@/components/camera/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function ScannerPage() {
  const [isCameraActive, setIsCameraActive] = useState(false)

  if (isCameraActive) {
    return <LabelCamera onCancel={() => setIsCameraActive(false)} />
  }

  return (
    <div className="flex flex-1 flex-col p-6 h-full">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">
          Scanner de Productos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Apuntá la cámara a los productos en la góndola
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 animate-in fade-in duration-300">
        <div className="rounded-3xl bg-muted p-8 ring-1 ring-border shadow-inner">
          <Camera className="h-16 w-16 text-muted-foreground" />
        </div>
        <div className="space-y-1.5 text-center">
          <p className="text-xl font-medium text-foreground">Cámara lista</p>
          <p className="text-sm text-muted-foreground">
            Presioná "Iniciar Scanner" para comenzar
          </p>
        </div>
      </div>

      <div className="shrink-0 pt-6">
        <Card className="flex flex-col gap-4 p-4 shadow-lg border-border">
          <div className="flex items-start gap-3 rounded-xl bg-primary/10 p-3 text-foreground border border-primary/20">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-xs font-medium leading-relaxed">
              El scanner usa OCR y consulta la base de ANMAT en tiempo real para
              verificar si los productos son aptos para celíacos.
            </p>
          </div>

          <Button
            size="lg"
            className="h-14 w-full text-base font-semibold rounded-xl shadow-md"
            onClick={() => setIsCameraActive(true)}
          >
            Iniciar Scanner
          </Button>
        </Card>
      </div>
    </div>
  )
}
