'use client'

import { useState } from 'react'
import { ScannerInfoPage } from '@/components/camera/info-page'
import { CameraOverlay } from '@/components/camera/overlay'

// Componente principal que maneja el estado de la cámara y muestra la página de información o la superposición de la cámara según corresponda.
export default function ScannerPage() {
  const [isCameraActive, setIsCameraActive] = useState(false)

  if (isCameraActive) {
    return <CameraOverlay setIsCameraActive={setIsCameraActive} />
  }

  return <ScannerInfoPage setIsCameraActive={setIsCameraActive} />
}
