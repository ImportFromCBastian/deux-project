'use client'

import { Activity, Eye, EyeOff, Moon, RefreshCw, Sun, Type } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAccessibilityStore } from '@/store/accessibility'

export function AccessibilityPanel() {
  const { setTheme, resolvedTheme } = useTheme()
  const {
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    dyslexiaFont,
    setDyslexiaFont,
    reducedMotion,
    setReducedMotion,
  } = useAccessibilityStore()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg tracking-tight flex items-center justify-between">
          Ajustes de Accesibilidad
          {fontSize !== 100 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFontSize}
              className="h-8 px-2 text-xs text-primary flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" aria-hidden="true" /> Reiniciar
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm leading-none font-medium select-none">
            <Type className="w-4 h-4" aria-hidden="true" /> Tamaño de Fuente (
            {fontSize}%)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={decreaseFontSize}
              disabled={fontSize <= 85}
              className="flex-1"
              aria-label="Disminuir tamaño de fuente"
            >
              A-
            </Button>
            <Button
              variant="outline"
              onClick={increaseFontSize}
              disabled={fontSize >= 145}
              className="flex-1"
              aria-label="Aumentar tamaño de fuente"
            >
              A+
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm leading-none font-medium select-none">
            Modo Visual
          </div>
          <div className="grid grid-cols-3 gap-2">
            {/* Usamos resolvedTheme para determinar la variante activa */}
            <Button
              variant={resolvedTheme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
              className="flex flex-col items-center gap-1 h-auto py-3 px-2"
            >
              <Sun className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs">Claro</span>
            </Button>
            <Button
              variant={resolvedTheme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
              className="flex flex-col items-center gap-1 h-auto py-3 px-2"
            >
              <Moon className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs">Oscuro</span>
            </Button>
            <Button
              variant={
                resolvedTheme === 'high-contrast' ? 'default' : 'outline'
              }
              onClick={() => setTheme('high-contrast')}
              className="flex flex-col items-center gap-1 h-auto py-3 px-2"
            >
              <Eye className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs">Contraste</span>
            </Button>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="dyslexia-mode"
              className="flex items-center gap-2 cursor-pointer"
            >
              <EyeOff className="w-4 h-4" aria-hidden="true" /> Fuente para
              Dislexia
            </Label>
            <Switch
              id="dyslexia-mode"
              checked={dyslexiaFont}
              onCheckedChange={setDyslexiaFont}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="reduced-motion"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Activity className="w-4 h-4" aria-hidden="true" /> Reducir
              Animaciones
            </Label>
            <Switch
              id="reduced-motion"
              checked={reducedMotion}
              onCheckedChange={setReducedMotion}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
