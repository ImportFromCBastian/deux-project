import { AccessibilityEnforcer } from '@/components/accessibility/enforcer'
import { AccessibilityPanel } from '@/components/accessibility/panel'

export const metadata = {
  title: 'Ajustes',
}

export default function Settings() {
  return (
    <>
      <AccessibilityEnforcer />
      <div className="flex flex-col gap-6 p-6 h-full">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Ajustes</h1>
          <p className="text-sm text-muted-foreground">
            Personalizá tu experiencia de accesibilidad
          </p>
        </div>
        <AccessibilityPanel />
      </div>
    </>
  )
}
