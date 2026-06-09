import { Button } from '@base-ui/react'
import { Camera, Info } from 'lucide-react'
import type { CameraOverlayProps } from '@/lib/types/camera'
import { Card } from '../ui/card'

// Página de información previa al scanner, con un botón para activar la cámara y un mensaje explicativo. Se muestra antes de activar el scanner y se oculta al hacerlo.
export function ScannerInfoPage({ setIsCameraActive }: CameraOverlayProps) {
  return (
    <>
      <section className="flex flex-1 flex-col items-center justify-center gap-5 animate-in fade-in duration-300">
        <Camera className="h-16 w-16 text-muted-foreground" />
        <div className="space-y-1.5 text-center">
          <p className="text-xl font-medium text-foreground">Cámara lista</p>
          <p className="text-sm text-muted-foreground">
            Presioná "Iniciar Scanner" para comenzar
          </p>
        </div>
      </section>

      <section className="shrink-0 pt-6">
        <Card className="flex flex-col gap-4 p-4 shadow-lg border-border">
          <div className="flex items-start gap-3 rounded-xl bg-primary/10 p-3 text-foreground border border-primary/20">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-xs font-medium leading-relaxed">
              El scanner usa OCR y consulta la base de ANMAT en tiempo real para
              verificar si los productos son aptos para celíacos.
            </p>
          </div>

          <Button
            className="h-14 w-full text-base font-semibold rounded-xl shadow-md"
            onClick={() => setIsCameraActive(true)}
          >
            Iniciar Scanner
          </Button>
        </Card>
      </section>
    </>
  )
}
