import { describe, it, expect } from 'vitest'
import {
  determineSource,
  deduplicateMeanings,
  mergeMeaningsAndBuildResponse,
} from '../../app/api/dictionary/route'

describe('dictionary route pure helpers', () => {
  describe('determineSource', () => {
    it('returns local+api+wiktionary when both local and freeApi exist', () => {
      expect(determineSource({ word: 'book' }, { meanings: [] }, null)).toBe('local+api+wiktionary')
    })

    it('returns local when only local exists', () => {
      expect(determineSource({ word: 'book' }, null, null)).toBe('local')
    })

    it('returns api+wiktionary when freeApi exists without local', () => {
      expect(determineSource(null, { meanings: [] }, null)).toBe('api+wiktionary')
    })

    it('returns wiktionary as fallback', () => {
      expect(determineSource(null, null, { extraMeanings: [] })).toBe('wiktionary')
    })
  })

  describe('deduplicateMeanings', () => {
    it('merges freeApi and wiktionary meanings without duplicate definitionEn', () => {
      const freeApi = [{ pos: 'noun', definitionEn: 'a written text' }]
      const wiktionary = [
        { pos: 'noun', definitionEn: 'a written text' }, // duplicate
        { pos: 'verb', definitionEn: 'to reserve a room' }, // new
      ]

      const merged = deduplicateMeanings(freeApi, wiktionary)
      expect(merged).toHaveLength(2)
      expect(merged[0].definitionEn).toBe('a written text')
      expect(merged[1].definitionEn).toBe('to reserve a room')
    })

    it('handles empty or undefined inputs gracefully', () => {
      expect(deduplicateMeanings(undefined, undefined)).toEqual([])
      expect(deduplicateMeanings([{ pos: 'n', definitionEn: 'test' }], undefined)).toHaveLength(1)
    })
  })

  describe('mergeMeaningsAndBuildResponse', () => {
    it('constructs a JSON response object with appropriate headers and fields', async () => {
      const local = { persian: 'کتاب', pos: 'اسم', phonetic: '/bʊk/' }
      const freeApi = {
        phonetic: '/bʊk/',
        audioUrl: 'http://audio.mp3',
        meanings: [{ pos: 'noun', definitionEn: 'a book' }],
      }

      const res = mergeMeaningsAndBuildResponse('book', local, freeApi, null)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.word).toBe('book')
      expect(json.persian).toBe('کتاب')
      expect(json.pos).toBe('اسم')
      expect(json.phonetic).toBe('/bʊk/')
      expect(json.audioUrl).toBe('http://audio.mp3')
      expect(json.source).toBe('local+api+wiktionary')
    })
  })
})
