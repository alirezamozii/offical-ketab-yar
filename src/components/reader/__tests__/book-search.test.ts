import { describe, it, expect } from 'vitest'
import {
  normalizeForSearch,
  extractSnippetAndSegments,
} from '@/components/reader/book-search-dialog'

describe('normalizeForSearch', () => {
  it('normalizes Persian Arabic yeh and kaf to Persian counterparts', () => {
    expect(normalizeForSearch('كتاب يار')).toBe('کتاب یار')
  })

  it('removes Persian/Arabic diacritics (tashkeel, tanvin)', () => {
    expect(normalizeForSearch('کِتَابٌ')).toBe('کتاب')
  })

  it('normalizes alef with madda to regular alef', () => {
    expect(normalizeForSearch('آب و آتش')).toBe('اب و اتش')
  })

  it('normalizes zwnj (half-space) to standard space', () => {
    expect(normalizeForSearch('کتاب\u200Cیار')).toBe('کتاب یار')
  })

  it('lowercases English text', () => {
    expect(normalizeForSearch('Lennie and George')).toBe('lennie and george')
  })
})

describe('extractSnippetAndSegments', () => {
  it('extracts matching segments for English query', () => {
    const text = 'A few miles south of Soledad, the Salinas River drops in close.'
    const result = extractSnippetAndSegments(text, 'Soledad', 50)
    expect(result.segments.some((s) => s.match && s.text === 'Soledad')).toBe(true)
  })

  it('extracts matching segments for Persian query with different yeh/kaf style', () => {
    const text = 'جورج و لنی در کنار رودخانه سالیناس ایستادند.'
    const result = extractSnippetAndSegments(text, 'لني', 40) // Arabic yeh in query
    expect(result.segments.some((s) => s.match && s.text === 'لنی')).toBe(true)
  })

  it('handles empty query gracefully', () => {
    const text = 'Hello world'
    const result = extractSnippetAndSegments(text, '', 50)
    expect(result.snippet).toBe('Hello world')
    expect(result.segments[0].match).toBe(false)
  })

  it('handles query not found gracefully', () => {
    const text = 'George looked at the river.'
    const result = extractSnippetAndSegments(text, 'rabbit', 50)
    expect(result.segments[0].match).toBe(false)
  })
})
