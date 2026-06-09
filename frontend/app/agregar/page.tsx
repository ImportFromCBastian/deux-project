'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const LocationPicker = dynamic(
  () => import('@/components/map/location-picker'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[300px] bg-muted rounded-2xl">
        <p className="text-muted-foreground text-sm">Cargando mapa...</p>
      </div>
    ),
  }
)

export default function CreatePinLocation() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name || !coords) {
      setError('Completá el nombre y seleccioná una ubicación en el mapa.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address: `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
          latitude: coords.lat,
          longitude: coords.lng,
        }),
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
    <div className="min-h-screen bg-background px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold text-foreground mb-1">Agregar local</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Ayudá a la comunidad celíaca marcando un local apto
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1 block">
            Nombre
          </label>
          <input
            type="text"
            placeholder="Ej: Panadería Sin TACC"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1 block">
            Ubicación
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Tocá el mapa para marcar la ubicación
          </p>
          <div className="rounded-2xl overflow-hidden border border-border h-[300px]">
            <LocationPicker onSelect={setCoords} />
          </div>
          {coords && (
            <p className="text-xs text-primary mt-1">
              ✓ Ubicación seleccionada
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Guardando...' : '🌿 Agregar local'}
        </button>
      </div>
    </div>
  )
}
