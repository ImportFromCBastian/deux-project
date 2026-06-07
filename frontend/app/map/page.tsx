'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

const MapComponent = dynamic(() => import('@/components/map/map-component'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-green-50">
      <p className="text-green-700 text-sm">Cargando mapa...</p>
    </div>
  ),
})

export default function ScreenMap() {
  return (
    <div className="relative w-full h-screen">
      <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-green-900">Locales Aptos Celíacos</h1>
          <p className="text-xs text-gray-500">Mapa colaborativo</p>
        </div>
        <Link
          href="/agregar"
          className="bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-green-800 transition-colors"
        >
          + Agregar
        </Link>
      </div>
      <div className="w-full h-full pt-[60px]">
        <MapComponent />
      </div>
    </div>
  )
}