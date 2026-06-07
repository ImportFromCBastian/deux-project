'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

const LocationPicker = dynamic(() => import('@/components/map/location-picker'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[300px] bg-green-50 rounded-2xl">
      <p className="text-green-700 text-sm">Cargando mapa...</p>
    </div>
  ),
})

export default function CreatePinLocation() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', address: '' })
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.name || !form.address || !coords) {
      setError('Completá todos los campos y seleccioná una ubicación en el mapa.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, latitude: coords.lat, longitude: coords.lng }),
      })
      if (!res.ok) throw new Error()
      router.push('/map')
    } catch {
      setError('No se pudo guardar el local. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 pb-24">
      <button onClick={() => router.back()} className="text-green-700 text-sm mb-4">← Volver</button>
      <h1 className="text-2xl font-bold text-green-900 mb-1">Agregar local</h1>
      <p className="text-sm text-gray-500 mb-6">Ayudá a la comunidad celíaca marcando un local apto</p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-green-800 uppercase tracking-wider mb-1 block">Nombre</label>
          <input
            type="text"
            placeholder="Ej: Panadería Sin TACC"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-green-800 uppercase tracking-wider mb-1 block">Dirección</label>
          <input
            type="text"
            placeholder="Ej: Av. Corrientes 1234, CABA"
            value={form.address}
            onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-green-800 uppercase tracking-wider mb-1 block">Ubicación</label>
          <p className="text-xs text-gray-500 mb-2">Tocá el mapa para marcar la ubicación</p>
          <div className="rounded-2xl overflow-hidden border border-gray-200 h-[300px]">
            <LocationPicker onSelect={setCoords} />
          </div>
          {coords && (
            <p className="text-xs text-green-700 mt-1">✓ Ubicación seleccionada</p>
          )}
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-green-700 text-white font-semibold py-4 rounded-2xl hover:bg-green-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Guardando...' : '🌿 Agregar local'}
        </button>
      </div>
    </div>
  )
}