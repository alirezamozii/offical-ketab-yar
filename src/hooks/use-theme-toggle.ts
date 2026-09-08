'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  executeThemeTransition,
  isThemeTransitionActive,
  type ThemeTransitionOptions,
} from '@/lib/theme-transition'

export type ThemeToggleEvent = ThemeTransitionOptions['event']

export function useThemeToggle() {
  const [theme, setThemeState] = useState('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const selected = stored === 'light' || stored === 'dark' ? stored : 'system'
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => {
      const resolved = selected === 'system' ? (media.matches ? 'dark' : 'light') : selected
      document.documentElement.classList.toggle('dark', resolved === 'dark')
      setResolvedTheme(resolved)
    }
    setThemeState(selected)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const setTheme = useCallback((nextTheme: string) => {
    const selected = nextTheme === 'light' || nextTheme === 'dark' ? nextTheme : 'system'
    if (selected === 'system') localStorage.removeItem('theme')
    else localStorage.setItem('theme', selected)
    const resolved =
      selected === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : selected
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    setThemeState(selected)
    setResolvedTheme(resolved)
  }, [])

  const toggleTheme = useCallback(
    (
      targetThemeOrEvent?: string | ThemeToggleEvent,
      eventArg?: ThemeToggleEvent
    ) => {
      // 1. Immediately drop calls while a transition is already running
      if (isThemeTransitionActive()) {
        return
      }

      let targetTheme: string | undefined
      let event: ThemeToggleEvent | undefined

      if (typeof targetThemeOrEvent === 'string') {
        targetTheme = targetThemeOrEvent
        event = eventArg
      } else {
        event = targetThemeOrEvent
      }

      const isDomDark =
        typeof document !== 'undefined'
          ? document.documentElement.classList.contains('dark')
          : resolvedTheme === 'dark'
      const current = isDomDark ? 'dark' : 'light'
      const nextTheme = targetTheme ?? (current === 'dark' ? 'light' : 'dark')

      // Avoid redundant transitions if target is identical to current
      if (
        targetTheme &&
        (targetTheme === current || (targetTheme === 'system' && theme === 'system'))
      ) {
        return
      }

      executeThemeTransition({
        theme: nextTheme,
        setTheme,
        event,
      })
    },
    [resolvedTheme, theme, setTheme]
  )

  return {
    theme,
    resolvedTheme,
    systemTheme: undefined,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
    isTransitioning: isThemeTransitionActive(),
  }
}
