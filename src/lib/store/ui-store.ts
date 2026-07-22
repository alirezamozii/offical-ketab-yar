/**
 * src/lib/store/ui-store.ts
 * ---------------------------------------------------------------
 * Zustand store for global UI state — command palette visibility,
 * mobile sidebar, active modals, etc.
 *
 * Selector-based subscriptions: a component that only reads
 * `commandPaletteOpen` doesn't re-render when `mobileSidebarOpen`
 * changes.
 *
 * Owner: Phase 3 R-FE.1
 * ---------------------------------------------------------------
 */

import { create } from 'zustand'

interface UIState {
  // Command palette (Cmd+K)
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void

  // Mobile sidebar / nav
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void
  toggleMobileSidebar: () => void

  // Global loading indicator
  globalLoading: boolean
  setGlobalLoading: (loading: boolean) => void
}

export const useUIStore = create<UIState>()((set) => ({
  commandPaletteOpen: false,
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

  mobileSidebarOpen: false,
  setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
  toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),

  globalLoading: false,
  setGlobalLoading: (globalLoading) => set({ globalLoading }),
}))
