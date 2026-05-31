import { MapIcon, PlusCircle, Scan, Settings } from 'lucide-react'

export const NAV_ITEMS = [
  {
    name: 'Scanner',
    href: '/scanner',
    icon: Scan,
  },
  {
    name: 'Mapa',
    href: '/map',
    icon: MapIcon,
  },
  {
    name: 'Agregar',
    href: '/agregar',
    icon: PlusCircle,
  },
  {
    name: 'Ajustes',
    href: '/settings',
    icon: Settings,
  },
]
