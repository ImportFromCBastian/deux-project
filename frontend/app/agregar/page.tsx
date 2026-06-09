'use client'

import { Loader2, MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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

interface NominatimAddress {
  road?: string
  pedestrian?: string
  construction?: string
  path?: string
  house_number?: string
  city?: string
  town?: string
  village?: string
  suburb?: string
}

interface NominatimSuggestion {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address?: NominatimAddress
}

export default function CreatePinLocation() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  )
  const [loading, setLoading] = useState(false)
  const [geocodingLoading, setGeocodingLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [skipSearch, setSkipSearch] = useState(false)
  const [error, setError] = useState('')

  // Fetch suggestions as user types (with debounce)
  useEffect(() => {
    if (skipSearch) {
      setSkipSearch(false)
      return
    }

    if (address.trim().length < 4) {
      setSuggestions([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setGeocodingLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(address)}&countrycodes=ar&limit=5&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'CeliApp-Argentinian-Community-App',
            },
          }
        )
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data || [])
          setShowSuggestions(true)
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err)
      } finally {
        setGeocodingLoading(false)
      }
    }, 500) // 500ms debounce to prevent API flooding

    return () => clearTimeout(delayDebounceFn)
  }, [address, skipSearch])

  const handleMapSelect = async (newCoords: { lat: number; lng: number }) => {
    setCoords(newCoords)
    setGeocodingLoading(true)
    setError('')
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newCoords.lat}&lon=${newCoords.lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CeliApp-Argentinian-Community-App',
          },
        }
      )
      if (res.ok) {
        const data = await res.json()
        if (data?.address) {
          const addr = data.address as NominatimAddress
          const street =
            addr.road || addr.pedestrian || addr.construction || addr.path || ''
          const number = addr.house_number || ''
          const city =
            addr.city || addr.town || addr.village || addr.suburb || ''

          let cleanAddress = ''
          if (street) {
            cleanAddress += street
            if (number) cleanAddress += ` ${number}`
            if (city) cleanAddress += `, ${city}`
          } else {
            cleanAddress = data.display_name
          }

          setSkipSearch(true) // prevent triggering suggestion query again
          setAddress(cleanAddress)
        }
      }
    } catch (err) {
      console.error('Error in reverse geocoding:', err)
    } finally {
      setGeocodingLoading(false)
    }
  }

  const handleSelectSuggestion = (suggestion: NominatimSuggestion) => {
    setSkipSearch(true)
    const lat = parseFloat(suggestion.lat)
    const lng = parseFloat(suggestion.lon)
    setCoords({ lat, lng })

    let cleanAddress = suggestion.display_name
    if (suggestion.address) {
      const addr = suggestion.address
      const street = addr.road || addr.pedestrian || ''
      const number = addr.house_number || ''
      const city = addr.city || addr.town || addr.village || addr.suburb || ''
      if (street) {
        cleanAddress = street
        if (number) cleanAddress += ` ${number}`
        if (city) cleanAddress += `, ${city}`
      }
    }
    setAddress(cleanAddress)
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleSubmit = async () => {
    if (!name || !coords || !address) {
      setError(
        'Completá el nombre, la dirección exacta y seleccioná una ubicación en el mapa.'
      )
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
          address,
          latitude: coords.lat,
          longitude: coords.lng,
          description,
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

      <div className="flex flex-col gap-5">
        <div>
          <label
            htmlFor="store-name-input"
            className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 block"
          >
            Nombre del local
          </label>
          <input
            id="store-name-input"
            type="text"
            placeholder="Ej: Panadería Sin TACC"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="relative">
          <label
            htmlFor="store-address-input"
            className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 block"
          >
            Dirección exacta
          </label>
          <div className="relative">
            <input
              id="store-address-input"
              type="text"
              placeholder="Ej: Av. Corrientes 1234, CABA"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
              className="w-full bg-card border border-border rounded-xl pl-4 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {geocodingLoading && (
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              >
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl z-50 max-h-[220px] overflow-y-auto divide-y divide-border animate-fade-in">
              {suggestions.map((s) => (
                <div key={s.place_id}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-4 py-3 text-xs text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer flex items-start gap-2 focus:outline-none focus:bg-accent focus:text-accent-foreground"
                  >
                    <MapPin
                      className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span className="line-clamp-2">{s.display_name}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-[14px] text-muted-foreground mt-1.5">
            Escribí la calle y altura para ver sugerencias, o marcá la ubicación
            directamente tocando el mapa abajo.
          </p>
        </div>

        <div>
          <label
            htmlFor="store-desc-input"
            className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 block"
          >
            Descripción (Opcional)
          </label>
          <textarea
            id="store-desc-input"
            placeholder="Ej: Tienen pan de masa madre sin TACC y facturas los fines de semana."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-y"
          />
        </div>

        <div>
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 block">
            Ubicación en el mapa
          </span>
          <div className="rounded-2xl overflow-hidden border border-border h-[300px] relative">
            <LocationPicker value={coords} onSelect={handleMapSelect} />
          </div>
          {coords && (
            <p
              className="text-xs text-primary mt-1.5 flex items-center gap-1"
              aria-live="polite"
            >
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                ✓ Ubicación seleccionada: {coords.lat.toFixed(5)},{' '}
                {coords.lng.toFixed(5)}
              </span>
            </p>
          )}
        </div>

        {error && (
          <p
            className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3"
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || geocodingLoading}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Guardando...</span>
            </>
          ) : (
            <span>🌿 Agregar local</span>
          )}
        </button>
      </div>
    </div>
  )
}
