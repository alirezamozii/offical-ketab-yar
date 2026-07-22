/**
 * src/lib/__tests__/ui-store.test.ts
 * ---------------------------------------------------------------
 * Tests for the Zustand UI store.
 *
 * Owner: Phase 8 R-TEST.2
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { useUIStore } from '@/lib/store/ui-store'

describe('ui-store', () => {
  beforeEach(() => {
    useUIStore.setState({
      commandPaletteOpen: false,
      mobileSidebarOpen: false,
      globalLoading: false,
    })
  })

  it('has correct initial state', () => {
    const state = useUIStore.getState()
    expect(state.commandPaletteOpen).toBe(false)
    expect(state.mobileSidebarOpen).toBe(false)
    expect(state.globalLoading).toBe(false)
  })

  it('setCommandPaletteOpen sets the value', () => {
    useUIStore.getState().setCommandPaletteOpen(true)
    expect(useUIStore.getState().commandPaletteOpen).toBe(true)
  })

  it('toggleCommandPalette flips the boolean', () => {
    expect(useUIStore.getState().commandPaletteOpen).toBe(false)
    useUIStore.getState().toggleCommandPalette()
    expect(useUIStore.getState().commandPaletteOpen).toBe(true)
    useUIStore.getState().toggleCommandPalette()
    expect(useUIStore.getState().commandPaletteOpen).toBe(false)
  })

  it('setMobileSidebarOpen sets the value', () => {
    useUIStore.getState().setMobileSidebarOpen(true)
    expect(useUIStore.getState().mobileSidebarOpen).toBe(true)
  })

  it('toggleMobileSidebar flips the boolean', () => {
    useUIStore.getState().toggleMobileSidebar()
    expect(useUIStore.getState().mobileSidebarOpen).toBe(true)
  })

  it('setGlobalLoading sets the value', () => {
    useUIStore.getState().setGlobalLoading(true)
    expect(useUIStore.getState().globalLoading).toBe(true)
  })
})
