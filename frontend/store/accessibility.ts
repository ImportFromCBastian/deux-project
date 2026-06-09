import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AccessibilityState = {
  fontSize: number
  dyslexiaFont: boolean
  reducedMotion: boolean
  increaseFontSize: () => void
  decreaseFontSize: () => void
  resetFontSize: () => void
  setDyslexiaFont: (val: boolean) => void
  setReducedMotion: (val: boolean) => void
}

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set) => ({
      fontSize: 100,
      dyslexiaFont: false,
      reducedMotion: false,
      increaseFontSize: () =>
        set((state) => ({ fontSize: Math.min(state.fontSize + 15, 145) })),
      decreaseFontSize: () =>
        set((state) => ({ fontSize: Math.max(state.fontSize - 15, 85) })),
      resetFontSize: () => set({ fontSize: 100 }),
      setDyslexiaFont: (val) => set({ dyslexiaFont: val }),
      setReducedMotion: (val) => set({ reducedMotion: val }),
    }),
    {
      name: 'a11y-preferences',
    }
  )
)
