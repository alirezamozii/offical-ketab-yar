import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  executeThemeTransition,
  _resetThemeTransitionStateForTesting,
} from '@/lib/theme-transition'

describe('executeThemeTransition', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    _resetThemeTransitionStateForTesting()
  })

  it('calls setTheme directly when document.startViewTransition is not supported', () => {
    const setTheme = vi.fn()
    
    // Simulate environment without startViewTransition
    const origStartViewTransition = (document as unknown as { startViewTransition?: unknown }).startViewTransition
    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition

    executeThemeTransition({
      theme: 'dark',
      setTheme,
    })

    expect(setTheme).toHaveBeenCalledWith('dark')

    if (origStartViewTransition) {
      (document as unknown as { startViewTransition?: unknown }).startViewTransition = origStartViewTransition
    }
  })

  it('calls setTheme directly when prefers-reduced-motion is true', () => {
    const setTheme = vi.fn()

    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    executeThemeTransition({
      theme: 'light',
      setTheme,
    })

    expect(setTheme).toHaveBeenCalledWith('light')
  })

  it('invokes document.startViewTransition and animates clip-path when supported', async () => {
    const setTheme = vi.fn()
    const animateMock = vi.fn()

    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const readyPromise = Promise.resolve()
    const startViewTransitionMock = vi.fn((cb: () => void) => {
      cb()
      return {
        ready: readyPromise,
        finished: Promise.resolve(),
      }
    })

    ;(document as unknown as { startViewTransition: unknown }).startViewTransition = startViewTransitionMock
    document.documentElement.animate = animateMock

    executeThemeTransition({
      theme: 'dark',
      setTheme,
      event: { clientX: 100, clientY: 200 } as unknown as React.MouseEvent,
    })

    expect(startViewTransitionMock).toHaveBeenCalled()
    expect(setTheme).toHaveBeenCalledWith('dark')

    await readyPromise

    expect(animateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clipPath: [
          'circle(0px at 100px 200px)',
          expect.stringMatching(/^circle\(\d+(\.\d+)?px at 100px 200px\)$/),
        ],
      }),
      expect.objectContaining({
        duration: 400,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        pseudoElement: '::view-transition-new(root)',
        fill: 'forwards',
      })
    )
  })

  it('safely handles rapid spam clicking by dropping redundant overlapping calls during transition', async () => {
    const setTheme = vi.fn()
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    let resolveFinished: () => void = () => {}
    const finishedPromise = new Promise<void>((resolve) => {
      resolveFinished = resolve
    })

    const startViewTransitionMock = vi.fn((cb: () => void) => {
      cb()
      return {
        ready: new Promise(() => {}), // keeps transition active
        finished: finishedPromise,
      }
    })

    ;(document as unknown as { startViewTransition: unknown }).startViewTransition = startViewTransitionMock

    // First click - initiates transition
    executeThemeTransition({ theme: 'dark', setTheme })
    expect(startViewTransitionMock).toHaveBeenCalledTimes(1)
    expect(setTheme).toHaveBeenLastCalledWith('dark')

    // Immediate second, third, fourth clicks (rapid spam) - should be safely ignored
    // to prevent concurrent DOM mutations and Chromium engine crashes
    executeThemeTransition({ theme: 'light', setTheme })
    executeThemeTransition({ theme: 'dark', setTheme })
    executeThemeTransition({ theme: 'light', setTheme })

    expect(startViewTransitionMock).toHaveBeenCalledTimes(1) // not called again!
    expect(setTheme).toHaveBeenCalledTimes(1) // redundant calls ignored!

    // Finish the active transition
    resolveFinished()
    await finishedPromise

    // Wait for microtask / cooldown
    await new Promise((resolve) => setTimeout(resolve, 160))

    // Subsequent click is now allowed and initiates next transition cleanly
    executeThemeTransition({ theme: 'light', setTheme })
    expect(startViewTransitionMock).toHaveBeenCalledTimes(2)
    expect(setTheme).toHaveBeenLastCalledWith('light')
  })

  it('safely recovers if startViewTransition throws synchronously', () => {
    const setTheme = vi.fn()
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as unknown as MediaQueryList)

    const startViewTransitionMock = vi.fn(() => {
      throw new Error('Unexpected DOM error')
    })

    ;(document as unknown as { startViewTransition: unknown }).startViewTransition = startViewTransitionMock

    executeThemeTransition({ theme: 'dark', setTheme })

    expect(setTheme).toHaveBeenCalledWith('dark')
    // Ensure lock is unlocked so subsequent transitions still work
    expect(startViewTransitionMock).toHaveBeenCalledTimes(1)
  })

  it('safely recovers and unlocks if transition.ready rejects', async () => {
    const setTheme = vi.fn()
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as unknown as MediaQueryList)

    let rejectReady: (reason?: unknown) => void = () => {}
    const readyPromise = new Promise<void>((_, reject) => {
      rejectReady = reject
    })

    const startViewTransitionMock = vi.fn((cb: () => void) => {
      cb()
      return {
        ready: readyPromise,
        finished: Promise.reject(new Error('aborted')),
      }
    })

    ;(document as unknown as { startViewTransition: unknown }).startViewTransition = startViewTransitionMock

    executeThemeTransition({ theme: 'dark', setTheme })
    expect(setTheme).toHaveBeenCalledWith('dark')

    rejectReady(new Error('Transition was skipped'))
    await new Promise((resolve) => setTimeout(resolve, 50))

    // After rejection, should be unlocked
    expect(startViewTransitionMock).toHaveBeenCalledTimes(1)
  })
})
