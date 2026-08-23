'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

// Suppress the harmless React 19 "Encountered a script tag" console warning
// triggered by next-themes' inline FOUC-prevention script. This is a known
// false positive — the script executes correctly during SSR as intended.
// See: https://github.com/pacocoursey/next-themes/issues/288
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const orig = console.error
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Encountered a script tag')
    ) {
      return
    }
    orig.apply(console, args)
  }
}

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
