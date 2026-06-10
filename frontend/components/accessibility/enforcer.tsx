'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAccessibilityStore } from '@/store/accessibility'

export function AccessibilityEnforcer() {
  const pathname = usePathname()
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

  // Asegura que al navegar con teclado, el elemento enfocado se desplace automáticamente a la vista
  useEffect(() => {
    if (!mounted) return

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target && typeof target.scrollIntoView === 'function') {
        if (target.tagName === 'BODY' || target.tagName === 'HTML') return

        target.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        })
      }
    }

    document.addEventListener('focus', handleFocus, true)
    return () => document.removeEventListener('focus', handleFocus, true)
  }, [mounted])

  // Foco automático en el título principal (h1) al cambiar de página
  useEffect(() => {
    if (!mounted) return

    const h1Element = document.querySelector('h1')
    const targetElement = h1Element || document.querySelector('main')

    if (targetElement) {
      if (!targetElement.hasAttribute('tabindex')) {
        targetElement.setAttribute('tabindex', '-1')
      }
      if (targetElement instanceof HTMLElement) {
        targetElement.style.outline = 'none'
      }

      // Retardo para asegurar que la nueva ruta esté completamente hidratada
      const timer = setTimeout(() => {
        targetElement.focus()
      }, 150)

      return () => clearTimeout(timer)
    }
  }, [pathname, mounted])

  // Ocultamos todo hasta que el cliente se hidrate para evitar FOUC
  if (!mounted) {
    return <style>{`body { visibility: hidden; }`}</style>
  }

  return null
}
