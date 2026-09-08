import { describe, it, expect } from 'vitest'
import { shuffle, buildDeck } from '../../components/vocabulary/practice-client'

describe('practice-client pure helper functions', () => {
  describe('shuffle', () => {
    it('returns a new array containing all original elements', () => {
      const arr = [1, 2, 3, 4, 5]
      const shuffled = shuffle(arr)
      expect(shuffled).toHaveLength(5)
      expect(shuffled.sort()).toEqual(arr)
      expect(shuffled).not.toBe(arr) // Returns new array reference
    })
  })

  describe('buildDeck', () => {
    it('returns empty array when words array is empty', () => {
      expect(buildDeck([], new Set(), 20)).toEqual([])
    })

    it('prioritizes due words at the beginning of the deck', () => {
      const words = [
        { id: '1', word: 'one', definition: '', translation: '', context: '', bookSlug: '' },
        { id: '2', word: 'two', definition: '', translation: '', context: '', bookSlug: '' },
        { id: '3', word: 'three', definition: '', translation: '', context: '', bookSlug: '' },
      ]
      const dueIds = new Set(['2'])

      const deck = buildDeck(words, dueIds, 2)
      expect(deck).toHaveLength(2)
      expect(deck[0].id).toBe('2') // due word comes first
    })

    it('respects maximum deck size', () => {
      const words = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        word: `w${i}`,
        definition: '',
        translation: '',
        context: '',
        bookSlug: '',
      }))

      const deck = buildDeck(words, new Set(), 5)
      expect(deck).toHaveLength(5)
    })
  })
})
