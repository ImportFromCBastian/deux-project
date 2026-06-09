'use client'

import L from 'leaflet'
import { useEffect, useState } from 'react'
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// biome-ignore lint/suspicious/noExplicitAny: Leaflet prototype override
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Props {
  value: { lat: number; lng: number } | null
  onSelect: (coords: { lat: number; lng: number }) => void
}

function LocationSetter({ coords }: { coords: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(coords, 15)
  }, [coords, map])
  return null
}

function ClickHandler({ onSelect }: { onSelect: Props['onSelect'] }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

export default function LocationPicker({ value, onSelect }: Props) {
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    )
  }, [])

  return (
    <MapContainer
      center={[-34.6037, -58.3816]}
      zoom={13}
      style={{ height: '100%', width: '100%', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userCoords && !value && <LocationSetter coords={userCoords} />}
      {value && <LocationSetter coords={[value.lat, value.lng]} />}
      <ClickHandler onSelect={onSelect} />
      {value && <Marker position={[value.lat, value.lng]} />}
    </MapContainer>
  )
}
