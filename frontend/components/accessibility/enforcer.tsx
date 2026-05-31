'use client'

import { useEffect, useState } from 'react'
import { useAccessibilityStore } from '@/store/accessibility'

export function AccessibilityEnforcer() {
  const [mounted, setMounted] = useState(false)
  const { fontSize, dyslexiaFont, reducedMotion } = useAccessibilityStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    document.documentElement.style.fontSize = `${fontSize}%`

    document.body.classList.toggle('font-dyslexic', dyslexiaFont)
    document.body.classList.toggle('force-reduced-motion', reducedMotion)
  }, [mounted, fontSize, dyslexiaFont, reducedMotion])

  // Ocultamos todo hasta que el cliente se hidrate para evitar FOUC
  if (!mounted) {
    return <style>{`body { visibility: hidden; }`}</style>
  }

  return null
}
