'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { buttonVariants } from '@/components/ui/button'
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
              {/* Le pasamos las variantes del botón directamente al className del Link */}
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  ${buttonVariants({ variant: 'ghost' })} 
                  flex h-auto w-full flex-col rounded-xl px-1 py-2 transition-colors 
                  ${
                    isActive
                      ? 'text-primary hover:text-primary/90 bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <Icon
                  className="mb-1 h-5 w-5"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[10px] font-medium tracking-wide">
                  {item.name}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
