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
        <AccessibilityPanel />
      </div>
    </>
  )
}
