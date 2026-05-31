import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/accessibility/provider'
import { BottomNav } from '@/components/ui/layout/bottom-nav'
import Header from '@/components/ui/layout/header'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'CeliAPP',
  description: 'App con A11y',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-dvh w-screen antialiased`}
    >
      {/* 1. body como contenedor flex principal que ocupa toda la pantalla */}
      <body className="flex h-full w-full flex-col overflow-hidden bg-background text-foreground transition-colors duration-200">
        <Providers>
          {/* --- HEADER --- */}
          {/* shrink-0 garantiza que el header jamás se aplaste */}
          <Header />

          {/* --- CONTENT --- */}
          {/* flex-1 toma TODO el espacio restante. 
              overflow-y-auto habilita el scroll solo en esta zona. */}
          <main className="flex flex-1 flex-col overflow-y-auto min-h-0">
            {children}
          </main>

          {/* --- BOTTOM NAV --- */}

          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
