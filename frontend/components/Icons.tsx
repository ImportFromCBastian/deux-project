import FontAwesome from '@expo/vector-icons/FontAwesome'
import type { ComponentProps } from 'react'

type IconProps = Omit<ComponentProps<typeof FontAwesome>, 'name'>

export const TabBarIcon = ({ color }: IconProps) => (
  <FontAwesome
    name="code"
    size={28}
    style={{ marginBottom: -3 }}
    color={color || '#fff'}
  />
)

export const InfoCircleIcon = ({ color }: IconProps) => (
  <FontAwesome
    name="info-circle"
    size={28}
    style={{ marginBottom: -3 }}
    color={color || '#fff'}
  />
)
