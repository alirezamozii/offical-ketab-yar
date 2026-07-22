/**
 * src/lib/__tests__/vocab-store.test.ts
 * ---------------------------------------------------------------
 * Tests for the Zustand vocabulary game store.
 *
 * Covers: startGame, recordAnswer (correct/incorrect), streak tracking,
 * bestStreak, endGame, resetSession.
 *
 * Owner: Phase 8 R-TEST.2
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useVocabGameStore } from '@/lib/store/vocab-store'

// Mock sessionStorage for the persist middleware
const sessionStorageMock = (() => {
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

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
})

describe('vocab-game-store', () => {
  beforeEach(() => {
    sessionStorageMock.clear()
    useVocabGameStore.getState().resetSession()
  })

  it('has correct initial state', () => {
    const state = useVocabGameStore.getState()
    expect(state.currentGame).toBeNull()
    expect(state.score).toBe(0)
    expect(state.streak).toBe(0)
    expect(state.bestStreak).toBe(0)
    expect(state.questionsAnswered).toBe(0)
    expect(state.correctAnswers).toBe(0)
  })

  it('startGame sets the game type and resets session', () => {
    useVocabGameStore.getState().startGame('match')
    expect(useVocabGameStore.getState().currentGame).toBe('match')
    expect(useVocabGameStore.getState().score).toBe(0)
  })

  it('recordAnswer with correct answer increments score and streak', () => {
    useVocabGameStore.getState().startGame('spell')
    useVocabGameStore.getState().recordAnswer(true)

    const state = useVocabGameStore.getState()
    expect(state.score).toBe(12) // 10 base + 2 streak bonus (streak=1, 1*2=2)
    expect(state.streak).toBe(1)
    expect(state.bestStreak).toBe(1)
    expect(state.questionsAnswered).toBe(1)
    expect(state.correctAnswers).toBe(1)
  })

  it('recordAnswer with incorrect answer resets streak but keeps score', () => {
    useVocabGameStore.getState().startGame('spell')
    useVocabGameStore.getState().recordAnswer(true) // streak=1, score=12
    useVocabGameStore.getState().recordAnswer(true) // streak=2, score=26
    useVocabGameStore.getState().recordAnswer(false) // streak=0, score stays 26

    const state = useVocabGameStore.getState()
    expect(state.score).toBe(26)
    expect(state.streak).toBe(0)
    expect(state.bestStreak).toBe(2)
    expect(state.questionsAnswered).toBe(3)
    expect(state.correctAnswers).toBe(2)
  })

  it('streak bonus increases with consecutive correct answers', () => {
    useVocabGameStore.getState().startGame('match')
    useVocabGameStore.getState().recordAnswer(true) // streak=1, score=10+2=12
    useVocabGameStore.getState().recordAnswer(true) // streak=2, score=12+10+4=26
    useVocabGameStore.getState().recordAnswer(true) // streak=3, score=26+10+6=42

    const state = useVocabGameStore.getState()
    expect(state.streak).toBe(3)
    expect(state.bestStreak).toBe(3)
    expect(state.score).toBe(42)
  })

  it('endGame clears the current game but keeps stats', () => {
    useVocabGameStore.getState().startGame('listen')
    useVocabGameStore.getState().recordAnswer(true)
    useVocabGameStore.getState().endGame()

    const state = useVocabGameStore.getState()
    expect(state.currentGame).toBeNull()
    expect(state.score).toBe(12) // stats preserved
  })

  it('resetSession clears everything', () => {
    useVocabGameStore.getState().startGame('match')
    useVocabGameStore.getState().recordAnswer(true)
    useVocabGameStore.getState().recordAnswer(true)

    useVocabGameStore.getState().resetSession()

    const state = useVocabGameStore.getState()
    expect(state.currentGame).toBeNull()
    expect(state.score).toBe(0)
    expect(state.streak).toBe(0)
    expect(state.questionsAnswered).toBe(0)
  })
})
