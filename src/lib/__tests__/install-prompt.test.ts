import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  canShowInstallPrompt,
  DISMISS_KEY,
  LAST_SHOWN_KEY,
  ONE_DAY_MS,
  writeDismissedAt,
  writeLastShownAt,
} from '@/components/pwa/install-prompt'

describe('PWA InstallPrompt Frequency Throttling (Once A Day)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('allows showing prompt if never shown or dismissed before', () => {
    const now = Date.now()
    expect(canShowInstallPrompt(now)).toBe(true)
  })

  it('blocks prompt if shown earlier today (< 24 hours ago)', () => {
    const now = Date.now()
    writeLastShownAt(now - 2 * 60 * 60 * 1000) // 2 hours ago
    expect(canShowInstallPrompt(now)).toBe(false)
  })

  it('allows prompt if shown more than 24 hours ago', () => {
    const now = Date.now()
    writeLastShownAt(now - 25 * 60 * 60 * 1000) // 25 hours ago
    expect(canShowInstallPrompt(now)).toBe(true)
  })

  it('blocks prompt if dismissed earlier today (< 24 hours ago)', () => {
    const now = Date.now()
    writeDismissedAt(now - 5 * 60 * 60 * 1000) // 5 hours ago
    expect(canShowInstallPrompt(now)).toBe(false)
  })

  it('allows prompt if dismissed more than 24 hours ago', () => {
    const now = Date.now()
    writeDismissedAt(now - 26 * 60 * 60 * 1000) // 26 hours ago
    expect(canShowInstallPrompt(now)).toBe(true)
  })

  it('permanently blocks prompt if app was already installed', () => {
    writeDismissedAt(Number.MAX_SAFE_INTEGER)
    const futureTime = Date.now() + 365 * 24 * 60 * 60 * 1000
    expect(canShowInstallPrompt(futureTime)).toBe(false)
  })
})
