'use client'

import L from 'leaflet'
import { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

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

  return (
    <MapContainer
      center={[-34.6037, -58.3816]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
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
        >
          <Popup>
            <p className="font-bold text-sm">🌿 {store.name}</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
