import { describe, it, expect } from 'vitest'
import {
  determineSource,
  deduplicateMeanings,
  determineDifficultyLevel,
  determineFrequencyBand,
  mergeMeaningsAndBuildResponse,
} from '../../app/api/dictionary/route'

describe('dictionary route pure helpers', () => {
  describe('determineSource', () => {
    it('returns combined string when sources exist', () => {
      expect(
        determineSource(
          { word: 'book' },
          { meanings: [] },
          { extraMeanings: [] },
          { synonyms: [] },
        ),
      ).toBe('local+api+datamuse+wiktionary')
    })

    it('returns local when only local exists', () => {
      expect(determineSource({ word: 'book' }, null, null, null)).toBe('local')
    })

    it('returns api+wiktionary when freeApi and wiktionary exist without local', () => {
      expect(
        determineSource(null, { meanings: [] }, { extraMeanings: [] }, null),
      ).toBe('api+wiktionary')
    })

    it('returns fallback string when none exist', () => {
      expect(determineSource(null, null, null, null)).toBe('free-network')
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
      expect(
        deduplicateMeanings([{ pos: 'n', definitionEn: 'test' }], undefined),
      ).toHaveLength(1)
    })
  })

  describe('determineDifficultyLevel', () => {
    it('determines level based on frequency score correctly', () => {
      expect(determineDifficultyLevel('the', 95)).toBe('A1')
      expect(determineDifficultyLevel('water', 50)).toBe('A2')
      expect(determineDifficultyLevel('journey', 20)).toBe('B1')
      expect(determineDifficultyLevel('serendipity', 1.5)).toBe('C1')
      expect(determineDifficultyLevel('obfuscate', 0.2)).toBe('C2')
    })

    it('falls back to length heuristic when score is not provided', () => {
      expect(determineDifficultyLevel('cat')).toBe('A1')
      expect(determineDifficultyLevel('planet')).toBe('A2')
      expect(determineDifficultyLevel('adventure')).toBe('B2')
    })
  })

  describe('determineFrequencyBand', () => {
    it('determines band based on frequency score', () => {
      expect(determineFrequencyBand(30)).toBe('common')
      expect(determineFrequencyBand(10)).toBe('uncommon')
      expect(determineFrequencyBand(1)).toBe('rare')
    })
  })

  describe('mergeMeaningsAndBuildResponse', () => {
    it('constructs a unified JSON response with both translation and persian fields', async () => {
      const local = { persian: 'کتاب', pos: 'اسم', phonetic: '/bʊk/' }
      const freeApi = {
        phonetic: '/bʊk/',
        audioUrl: 'https://example.com/audio.mp3',
        meanings: [{ pos: 'noun', definitionEn: 'a book', example: 'I read a book' }],
        synonyms: ['volume', 'tome'],
        antonyms: [],
      }
      const datamuse = {
        synonyms: ['novel', 'publication'],
        antonyms: [],
        relatedWords: ['author', 'reader'],
        frequencyScore: 85,
      }

      const res = mergeMeaningsAndBuildResponse(
        'book',
        local,
        freeApi,
        null,
        datamuse,
        'کتاب',
      )
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.word).toBe('book')
      expect(json.translation).toBe('کتاب')
      expect(json.persian).toBe('کتاب')
      expect(json.definition).toBe('a book')
      expect(json.example).toBe('I read a book')
      expect(json.partOfSpeech).toBe('اسم')
      expect(json.pos).toBe('اسم')
      expect(json.phonetic).toBe('/bʊk/')
      expect(json.audioUrl).toBe('https://example.com/audio.mp3')
      expect(json.synonyms).toContain('volume')
      expect(json.synonyms).toContain('novel')
      expect(json.relatedWords).toContain('author')
      expect(json.difficultyLevel).toBe('A1')
      expect(json.frequencyBand).toBe('common')
    })
  })
})
