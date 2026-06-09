import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AccessibilityEnforcer } from '@/components/accessibility/enforcer'
import { Providers } from '@/components/accessibility/provider'
import { BottomNav } from '@/components/ui/layout/bottom-nav'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: { template: '%s | CeliAPP ', default: 'CeliAPP' },
  description: 'App con A11y',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground antialiased transition-colors duration-200`}
      >
        <Providers>
          <AccessibilityEnforcer />
          <main className="flex flex-1 flex-col overflow-y-auto min-h-0">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
