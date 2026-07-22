/**
 * src/lib/store/onboarding-store.ts
 * ---------------------------------------------------------------
 * Zustand store for onboarding step tracking — replaces the
 * scattered localStorage reads in the onboarding flow.
 *
 * Persists: step index, completed flag, skipped flag, selected
 * level, selected genres, first book slug.
 *
 * Owner: Phase 3 R-FE.1
 * ---------------------------------------------------------------
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface OnboardingState {
  step: number
  completed: boolean
  skipped: boolean
  completedAt: string | null
  selectedLevel: string | null
  selectedGenres: string[]
  firstBookSlug: string | null

  // Actions
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  complete: () => void
  skip: () => void
  setSelectedLevel: (level: string) => void
  toggleGenre: (genre: string) => void
  setFirstBookSlug: (slug: string) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      step: 0,
      completed: false,
      skipped: false,
      completedAt: null,
      selectedLevel: null,
      selectedGenres: [],
      firstBookSlug: null,

      setStep: (step) => set({ step }),
      nextStep: () => set((s) => ({ step: s.step + 1 })),
      prevStep: () => set((s) => ({ step: Math.max(0, s.step - 1) })),
      complete: () => set({ completed: true, completedAt: new Date().toISOString() }),
      skip: () => set({ skipped: true }),
      setSelectedLevel: (selectedLevel) => set({ selectedLevel }),
      toggleGenre: (genre) =>
        set((s) => ({
          selectedGenres: s.selectedGenres.includes(genre)
            ? s.selectedGenres.filter((g) => g !== genre)
            : [...s.selectedGenres, genre],
        })),
      setFirstBookSlug: (firstBookSlug) => set({ firstBookSlug }),
      reset: () =>
        set({
          step: 0,
          completed: false,
          skipped: false,
          completedAt: null,
          selectedLevel: null,
          selectedGenres: [],
          firstBookSlug: null,
        }),
    }),
    {
      name: 'ky_onboarding_state',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)
