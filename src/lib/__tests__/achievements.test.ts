import { describe, it, expect } from 'vitest'
import { progressFor, type AchievementStats } from '../achievements'

describe('progressFor', () => {
  const dummyStats: AchievementStats = {
    booksStarted: 5,
    booksCompleted: 2,
    pagesRead: 150,
    totalReadingDays: 8,
    currentStreak: 4,
    longestStreak: 7,
    vocabCount: 60,
    gamesPlayed: 12,
    userLevel: 3,
    nightReadingDays: 1,
    audioMinutesRead: 20,
    favoriteGenreCount: 2,
  }

  it('computes correct progress for booksStarted achievements', () => {
    expect(progressFor('first-book', dummyStats)).toBe(5)
    expect(progressFor('books-5', dummyStats)).toBe(5)
  })

  it('computes correct progress for booksCompleted achievements', () => {
    expect(progressFor('first-finish', dummyStats)).toBe(2)
    expect(progressFor('books-finish-3', dummyStats)).toBe(2)
  })

  it('computes correct progress for pagesRead achievements', () => {
    expect(progressFor('pages-100', dummyStats)).toBe(150)
    expect(progressFor('pages-500', dummyStats)).toBe(150)
  })

  it('computes correct progress for streak achievements', () => {
    expect(progressFor('streak-7', dummyStats)).toBe(7)
    expect(progressFor('streak-30-cur', dummyStats)).toBe(4)
  })

  it('returns 0 for unknown achievement id', () => {
    expect(progressFor('non-existent-id', dummyStats)).toBe(0)
  })
})
