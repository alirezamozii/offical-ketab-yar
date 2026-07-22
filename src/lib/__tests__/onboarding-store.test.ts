/**
 * src/lib/__tests__/onboarding-store.test.ts
 * ---------------------------------------------------------------
 * Tests for the Zustand onboarding store.
 *
 * Covers: step navigation, complete/skip, genre toggle, level selection,
 * reset.
 *
 * Owner: Phase 8 R-TEST.2
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOnboardingStore } from '@/lib/store/onboarding-store'

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

describe('onboarding-store', () => {
  beforeEach(() => {
    localStorageMock.clear()
    useOnboardingStore.getState().reset()
  })

  it('has correct initial state', () => {
    const state = useOnboardingStore.getState()
    expect(state.step).toBe(0)
    expect(state.completed).toBe(false)
    expect(state.skipped).toBe(false)
    expect(state.completedAt).toBeNull()
    expect(state.selectedLevel).toBeNull()
    expect(state.selectedGenres).toEqual([])
    expect(state.firstBookSlug).toBeNull()
  })

  it('nextStep increments the step', () => {
    useOnboardingStore.getState().nextStep()
    expect(useOnboardingStore.getState().step).toBe(1)
    useOnboardingStore.getState().nextStep()
    expect(useOnboardingStore.getState().step).toBe(2)
  })

  it('prevStep decrements but never below 0', () => {
    useOnboardingStore.getState().setStep(3)
    useOnboardingStore.getState().prevStep()
    expect(useOnboardingStore.getState().step).toBe(2)
    useOnboardingStore.getState().prevStep()
    useOnboardingStore.getState().prevStep()
    useOnboardingStore.getState().prevStep()
    expect(useOnboardingStore.getState().step).toBe(0)
  })

  it('complete sets completed + completedAt', () => {
    useOnboardingStore.getState().complete()
    const state = useOnboardingStore.getState()
    expect(state.completed).toBe(true)
    expect(state.completedAt).not.toBeNull()
  })

  it('skip sets skipped flag', () => {
    useOnboardingStore.getState().skip()
    expect(useOnboardingStore.getState().skipped).toBe(true)
  })

  it('setSelectedLevel stores the level', () => {
    useOnboardingStore.getState().setSelectedLevel('B1')
    expect(useOnboardingStore.getState().selectedLevel).toBe('B1')
  })

  it('toggleGenre adds and removes genres', () => {
    useOnboardingStore.getState().toggleGenre('Classic')
    expect(useOnboardingStore.getState().selectedGenres).toEqual(['Classic'])

    useOnboardingStore.getState().toggleGenre('Adventure')
    expect(useOnboardingStore.getState().selectedGenres).toEqual(['Classic', 'Adventure'])

    // Toggle off
    useOnboardingStore.getState().toggleGenre('Classic')
    expect(useOnboardingStore.getState().selectedGenres).toEqual(['Adventure'])
  })

  it('setFirstBookSlug stores the slug', () => {
    useOnboardingStore.getState().setFirstBookSlug('alice-in-wonderland')
    expect(useOnboardingStore.getState().firstBookSlug).toBe('alice-in-wonderland')
  })

  it('reset restores all defaults', () => {
    useOnboardingStore.getState().setStep(5)
    useOnboardingStore.getState().setSelectedLevel('A2')
    useOnboardingStore.getState().toggleGenre('Fantasy')
    useOnboardingStore.getState().complete()

    useOnboardingStore.getState().reset()

    const state = useOnboardingStore.getState()
    expect(state.step).toBe(0)
    expect(state.completed).toBe(false)
    expect(state.selectedLevel).toBeNull()
    expect(state.selectedGenres).toEqual([])
  })
})
