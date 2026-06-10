'use client'

import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { List, Map as MapIcon, MapPin, X } from 'lucide-react'

// biome-ignore lint/suspicious/noExplicitAny: Leaflet prototype override
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const greenIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface Store {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  description?: string
}

function LocationSetter({ coords }: { coords: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(coords, 15)
  }, [coords, map])
  return null
}

export default function MapComponent() {
  const [stores, setStores] = useState<Store[]>([])
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/stores`)
      .then((res) => res.json())
      .then(setStores)
      .catch(console.error)
  }, [])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords([pos.coords.latitude, pos.coords.longitude]),
      () => {} // si el usuario niega el permiso, queda en Buenos Aires
    )
  }, [])

  // Auto-focus panel when selectedStore changes for screen readers / keyboard accessibility
  useEffect(() => {
    if (selectedStore) {
      panelRef.current?.focus()
    }
  }, [selectedStore])

  // Cerrar panel al apretar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedStore(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="relative w-full h-full">
      {/* Botón flotante para alternar entre Mapa y Listado (Accesibilidad Visual) */}
      <button
        type="button"
        onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
        className="absolute top-3 right-3 z-[999] bg-card border border-border px-3.5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring flex items-center gap-1.5 cursor-pointer text-foreground transition-all"
        aria-label={
          viewMode === 'map' ? 'Mostrar listado de locales' : 'Mostrar mapa'
        }
      >
        {viewMode === 'map' ? (
          <>
            <List className="w-4 h-4" aria-hidden="true" />
            <span>Ver Lista</span>
          </>
        ) : (
          <>
            <MapIcon className="w-4 h-4" aria-hidden="true" />
            <span>Ver Mapa</span>
          </>
        )}
      </button>

      {viewMode === 'list' ? (
        <div className="w-full h-full overflow-y-auto bg-background px-4 pb-24 pt-16 flex flex-col gap-4">
          <h2 className="text-xl font-extrabold text-foreground py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
            Locales Registrados ({stores.length})
          </h2>
          {stores.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              No se encontraron locales cargados.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {stores.map((store) => (
                <div
                  key={store.id}
                  className="bg-card text-card-foreground p-5 rounded-2xl border border-border shadow-sm flex flex-col gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  tabIndex={0}
                  aria-label={`Local: ${store.name}. Dirección: ${store.address}. ${store.description ? `Descripción: ${store.description}` : ''}`}
                >
                  <div className="flex flex-col gap-1">
                    <h3 className="font-bold text-lg text-foreground">
                      <span aria-hidden="true">🌿</span> {store.name}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <MapPin
                        className="w-4 h-4 text-primary shrink-0"
                        aria-hidden="true"
                      />
                      {store.address}
                    </p>
                  </div>
                  {store.description && (
                    <p className="text-sm text-foreground/80 border-t border-border pt-2">
                      {store.description}
                    </p>
                  )}
                  <div className="mt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStore(store)
                        setViewMode('map')
                      }}
                      className="flex-1 bg-muted hover:bg-muted/80 text-foreground text-center text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                    >
                      Ver en el mapa
                    </button>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-primary text-primary-foreground text-center text-sm font-semibold py-2.5 px-4 rounded-xl hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                    >
                      Cómo llegar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <MapContainer
          center={[-34.6037, -58.3816]}
          zoom={13}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {userCoords && <LocationSetter coords={userCoords} />}
          {stores.map((store) => (
            <Marker
              key={store.id}
              position={[store.latitude, store.longitude]}
              icon={greenIcon}
              alt={`Local: ${store.name}`}
              eventHandlers={{
                click: () => {
                  setSelectedStore(store)
                },
              }}
            />
          ))}
        </MapContainer>
      )}

      {/* Panel de detalles flotante/Bottom Sheet */}
      {selectedStore && (
        <div
          ref={panelRef}
          id="store-details-panel"
          className="absolute bottom-4 left-4 right-4 z-[1000] bg-card text-card-foreground p-5 rounded-2xl border border-border shadow-2xl animate-slide-up focus:outline-none focus:ring-2 focus:ring-ring"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-title"
          tabIndex={-1}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1.5 flex-1">
              <h2
                id="detail-title"
                className="text-lg font-bold text-foreground flex items-center gap-2"
              >
                <span aria-hidden="true">🌿</span> {selectedStore.name}
              </h2>
              <div className="text-sm text-muted-foreground flex items-start gap-1.5">
                <MapPin
                  className="w-4 h-4 text-primary shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{selectedStore.address}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedStore(null)}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring transition-colors cursor-pointer"
              aria-label="Cerrar detalles de local"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {selectedStore.description && (
            <div className="mt-4 pt-3 border-t border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Descripción
              </h3>
              <p className="text-sm text-foreground leading-relaxed">
                {selectedStore.description}
              </p>
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedStore.latitude},${selectedStore.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-primary text-primary-foreground text-center text-sm font-semibold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            >
              Cómo llegar
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
