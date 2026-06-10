'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/lib/routing/routes'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col bg-background pb-safe">
      <ul className="flex h-16 items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <li key={item.name} className="flex flex-1 justify-center">
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  flex h-auto w-full flex-col items-center justify-center rounded-xl px-1 py-2 transition-colors
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                  ${
                    isActive
                      ? 'text-blue-500'
                      : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <Icon
                  className="mb-1 h-5 w-5"
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                />
                <span className="font-medium tracking-wide">{item.name}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
