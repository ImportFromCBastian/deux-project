import { AccessibilityEnforcer } from '@/components/accessibility/enforcer'
import { AccessibilityPanel } from '@/components/accessibility/panel'

export default function Settings() {
  return (
    <div>
      <AccessibilityEnforcer />
      <AccessibilityPanel />
    </div>
  )
}
