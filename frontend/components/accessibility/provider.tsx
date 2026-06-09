'use client'

import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'
import { AccessibilityEnforcer } from './enforcer'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={['light', 'dark', 'high-contrast']}
    >
      <AccessibilityEnforcer />
      {children}
    </ThemeProvider>
  )
}
