'use client'

import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('@/components/map/map-component'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-background">
      <p className="text-primary text-sm">Cargando mapa...</p>
    </div>
  ),
})

export default function ScreenMap() {
  return (
    <div className="relative w-full h-full">
      <div className="absolute top-0 left-0 right-0 z-10 bg-card border-b border-border px-4 py-3">
        <h1 className="text-lg font-bold text-foreground">Locales Aptos Celíacos</h1>
        <p className="text-xs text-muted-foreground">Mapa colaborativo</p>
      </div>
      <div className="w-full h-full pt-[60px]">
        <MapComponent />
      </div>
    </div>
  )
}