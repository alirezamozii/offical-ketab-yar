/**
 * src/lib/store/reader-settings-store.ts
 * ---------------------------------------------------------------
 * Zustand store for reader settings — persists to localStorage so
 * the user's font size, theme, translation toggle, etc. survive
 * across sessions and devices (when merged via the sync flow).
 *
 * Replaces the old `useReadingPreferences` hook + the settings panel's
 * scattered useState calls. Selector-based subscriptions mean a
 * component that only reads `fontSize` doesn't re-render when `theme`
 * changes.
 *
 * Owner: Phase 3 R-FE.1
 * ---------------------------------------------------------------
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type ReaderTheme = 'light' | 'sepia' | 'dark' | 'high-contrast'
export type ReaderFontFamily = 'vazirmatn' | 'serif' | 'sans'
export type ReaderFontWeight = 'thin' | 'normal' | 'bold'
export type ReaderPageMode = 'paged' | 'scroll'

interface ReaderSettingsState {
  // Typography
  fontSize: number
  fontFamily: ReaderFontFamily
  fontWeight: ReaderFontWeight
  lineHeight: number
  letterSpacing: number

  // Theme
  theme: ReaderTheme

  // Translation + subtitles
  showTranslation: boolean
  showSubtitles: boolean

  // Page mode
  pageMode: ReaderPageMode

  // Audio
  voiceId: string
  audioSpeed: number

  // Actions
  setFontSize: (size: number) => void
  setFontFamily: (family: ReaderFontFamily) => void
  setFontWeight: (weight: ReaderFontWeight) => void
  setLineHeight: (height: number) => void
  setLetterSpacing: (spacing: number) => void
  setTheme: (theme: ReaderTheme) => void
  toggleTheme: () => void
  setShowTranslation: (show: boolean) => void
  toggleTranslation: () => void
  setShowSubtitles: (show: boolean) => void
  toggleSubtitles: () => void
  setPageMode: (mode: ReaderPageMode) => void
  setVoiceId: (id: string) => void
  setAudioSpeed: (speed: number) => void
  reset: () => void
}

const DEFAULTS = {
  fontSize: 18,
  fontFamily: 'vazirmatn' as ReaderFontFamily,
  fontWeight: 'normal' as ReaderFontWeight,
  lineHeight: 1.8,
  letterSpacing: 0,
  theme: 'sepia' as ReaderTheme,
  showTranslation: true,
  showSubtitles: true,
  pageMode: 'scroll' as ReaderPageMode,
  voiceId: 'fa-IR-FaridNeural',
  audioSpeed: 1.0,
}

export const useReaderSettingsStore = create<ReaderSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setFontSize: (fontSize) => set({ fontSize }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setFontWeight: (fontWeight) => set({ fontWeight }),
      setLineHeight: (lineHeight) => set({ lineHeight }),
      setLetterSpacing: (letterSpacing) => set({ letterSpacing }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((s) => {
          const themes: ReaderTheme[] = ['light', 'sepia', 'dark', 'high-contrast']
          const idx = themes.indexOf(s.theme)
          return { theme: themes[(idx + 1) % themes.length] }
        }),
      setShowTranslation: (showTranslation) => set({ showTranslation }),
      toggleTranslation: () => set((s) => ({ showTranslation: !s.showTranslation })),
      setShowSubtitles: (showSubtitles) => set({ showSubtitles }),
      toggleSubtitles: () => set((s) => ({ showSubtitles: !s.showSubtitles })),
      setPageMode: (pageMode) => set({ pageMode }),
      setVoiceId: (voiceId) => set({ voiceId }),
      setAudioSpeed: (audioSpeed) => set({ audioSpeed }),
      reset: () => set(DEFAULTS),
    }),
    {
      name: 'ky_reader_settings',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)
