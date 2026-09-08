'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export function SiteHeaderMore({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const secondaryActive = items.some((item) =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'group relative flex items-center gap-1 px-3 py-1.5 rounded-full',
            'text-xs font-semibold transition-colors duration-200',
            FOCUS_RING,
            secondaryActive
              ? 'text-gold-700 dark:text-gold-300 bg-gold-500/15 ring-1 ring-gold-500/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
          )}
          aria-label="بیشتر"
        >
          <ChevronDown className="h-4 w-4" />
          <span>بیشتر</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-2xl backdrop-blur-xl">
        {items.map((item) => {
          const active = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <DropdownMenuItem key={item.href} asChild>
              <Link
                href={item.href}
                className={cn(
                  'gap-2 cursor-pointer',
                  active && 'text-gold-600 dark:text-gold-400 font-bold'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
