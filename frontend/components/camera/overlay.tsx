import type { CameraOverlayProps } from '@/lib/types/camera'
import LabelCamera from './label'

// Componente para mostrar el overlay de la cámara. Recibe una función para desactivar la cámara y volver a la página de información. Se muestra al activar el scanner y se oculta al cancelar o finalizar el escaneo.
export function CameraOverlay({ setIsCameraActive }: CameraOverlayProps) {
  return <LabelCamera onCancel={() => setIsCameraActive(false)} />
}
