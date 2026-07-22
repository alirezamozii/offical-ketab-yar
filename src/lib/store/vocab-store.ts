/**
 * src/lib/store/vocab-store.ts
 * ---------------------------------------------------------------
 * Zustand store for vocabulary game state — current game type,
 * score, streak, and session metadata. Persists game progress
 * across page reloads within a session.
 *
 * SRS (spaced repetition) state stays in the existing `use-srs.ts`
 * hook (it has complex localStorage interactions); this store
 * handles the lighter-weight game-session state.
 *
 * Owner: Phase 3 R-FE.1
 * ---------------------------------------------------------------
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type VocabGameType = 'match' | 'spell' | 'listen' | 'sentence' | 'flashcard'

interface VocabGameState {
  // Current game session
  currentGame: VocabGameType | null
  score: number
  streak: number
  bestStreak: number
  questionsAnswered: number
  correctAnswers: number

  // Actions
  startGame: (type: VocabGameType) => void
  endGame: () => void
  recordAnswer: (correct: boolean) => void
  resetSession: () => void
}

export const useVocabGameStore = create<VocabGameState>()(
  persist(
    (set) => ({
      currentGame: null,
      score: 0,
      streak: 0,
      bestStreak: 0,
      questionsAnswered: 0,
      correctAnswers: 0,

      startGame: (type) =>
        set({
          currentGame: type,
          score: 0,
          streak: 0,
          questionsAnswered: 0,
          correctAnswers: 0,
        }),

      endGame: () => set({ currentGame: null }),

      recordAnswer: (correct) =>
        set((s) => {
          const newStreak = correct ? s.streak + 1 : 0
          return {
            score: s.score + (correct ? 10 + newStreak * 2 : 0),
            streak: newStreak,
            bestStreak: Math.max(s.bestStreak, newStreak),
            questionsAnswered: s.questionsAnswered + 1,
            correctAnswers: s.correctAnswers + (correct ? 1 : 0),
          }
        }),

      resetSession: () =>
        set({
          currentGame: null,
          score: 0,
          streak: 0,
          questionsAnswered: 0,
          correctAnswers: 0,
        }),
    }),
    {
      name: 'ky_vocab_game',
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
    },
  ),
)
