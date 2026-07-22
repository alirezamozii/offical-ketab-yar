/**
 * src/lib/__tests__/reader-settings-store.test.ts
 * ---------------------------------------------------------------
 * Tests for the Zustand reader-settings store.
 *
 * Covers: default values, setters, toggleTheme cycle, toggleTranslation,
 * toggleSubtitles, reset.
 *
 * Owner: Phase 8 R-TEST.2
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useReaderSettingsStore } from '@/lib/store/reader-settings-store'

// Mock localStorage for the persist middleware
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('reader-settings-store', () => {
  beforeEach(() => {
    localStorageMock.clear()
    useReaderSettingsStore.getState().reset()
  })

  it('has correct default values', () => {
    const state = useReaderSettingsStore.getState()
    expect(state.fontSize).toBe(18)
    expect(state.fontFamily).toBe('vazirmatn')
    expect(state.theme).toBe('sepia')
    expect(state.showTranslation).toBe(true)
    expect(state.showSubtitles).toBe(true)
    expect(state.pageMode).toBe('scroll')
    expect(state.voiceId).toBe('fa-IR-FaridNeural')
    expect(state.audioSpeed).toBe(1.0)
  })

  it('setFontSize updates the font size', () => {
    useReaderSettingsStore.getState().setFontSize(24)
    expect(useReaderSettingsStore.getState().fontSize).toBe(24)
  })

  it('setFontFamily updates the font family', () => {
    useReaderSettingsStore.getState().setFontFamily('serif')
    expect(useReaderSettingsStore.getState().fontFamily).toBe('serif')
  })

  it('setTheme updates the theme', () => {
    useReaderSettingsStore.getState().setTheme('dark')
    expect(useReaderSettingsStore.getState().theme).toBe('dark')
  })

  it('toggleTheme cycles through all 4 themes', () => {
    const store = useReaderSettingsStore.getState()
    expect(store.theme).toBe('sepia')

    store.toggleTheme()
    expect(useReaderSettingsStore.getState().theme).toBe('dark')

    useReaderSettingsStore.getState().toggleTheme()
    expect(useReaderSettingsStore.getState().theme).toBe('high-contrast')

    useReaderSettingsStore.getState().toggleTheme()
    expect(useReaderSettingsStore.getState().theme).toBe('light')

    useReaderSettingsStore.getState().toggleTheme()
    expect(useReaderSettingsStore.getState().theme).toBe('sepia')
  })

  it('toggleTranslation flips the boolean', () => {
    expect(useReaderSettingsStore.getState().showTranslation).toBe(true)
    useReaderSettingsStore.getState().toggleTranslation()
    expect(useReaderSettingsStore.getState().showTranslation).toBe(false)
    useReaderSettingsStore.getState().toggleTranslation()
    expect(useReaderSettingsStore.getState().showTranslation).toBe(true)
  })

  it('toggleSubtitles flips the boolean', () => {
    expect(useReaderSettingsStore.getState().showSubtitles).toBe(true)
    useReaderSettingsStore.getState().toggleSubtitles()
    expect(useReaderSettingsStore.getState().showSubtitles).toBe(false)
  })

  it('setPageMode updates the page mode', () => {
    useReaderSettingsStore.getState().setPageMode('paged')
    expect(useReaderSettingsStore.getState().pageMode).toBe('paged')
  })

  it('setVoiceId updates the voice', () => {
    useReaderSettingsStore.getState().setVoiceId('en-US-AvaMultilingualNeural')
    expect(useReaderSettingsStore.getState().voiceId).toBe('en-US-AvaMultilingualNeural')
  })

  it('reset restores all defaults', () => {
    const store = useReaderSettingsStore.getState()
    store.setFontSize(30)
    store.setTheme('dark')
    store.toggleTranslation()

    useReaderSettingsStore.getState().reset()

    const state = useReaderSettingsStore.getState()
    expect(state.fontSize).toBe(18)
    expect(state.theme).toBe('sepia')
    expect(state.showTranslation).toBe(true)
  })
})
