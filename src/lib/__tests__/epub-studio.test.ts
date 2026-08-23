import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { parseEpubBuffer, parseZipBuffer } from '@/lib/epub-parser'
import {
  EPUB_BATCH_TRANSLATE_PROMPT,
  buildEpubBatchAiPrompt,
} from '@/payload/prompts/ai-prompts'

describe('EPUB Studio & Batch Translation System', () => {
  it('should verify EPUB_BATCH_TRANSLATE_PROMPT definition', () => {
    expect(EPUB_BATCH_TRANSLATE_PROMPT.id).toBe('epub-batch')
    expect(EPUB_BATCH_TRANSLATE_PROMPT.systemPrompt).toContain('Direct Autonomous Mode')
    expect(EPUB_BATCH_TRANSLATE_PROMPT.sampleJson.pages[0].pageNumber).toBe(1)
    expect(EPUB_BATCH_TRANSLATE_PROMPT.sampleJson.pages[0].fa).toBeTruthy()
  })

  it('should build a complete dynamic AI prompt without interactive chatter', () => {
    const mockPages = [
      {
        pageNumber: 1,
        english: 'Mr. Dursley was the director of a firm called Grunnings.\n\nHe was a big, beefy man.',
      },
      {
        pageNumber: 2,
        english: 'Mrs. Dursley was thin and blonde.',
      },
    ]

    const prompt = buildEpubBatchAiPrompt(mockPages, {
      bookTitle: "Harry Potter and the Philosopher's Stone",
      chapterTitle: 'Chapter 1: The Boy Who Lived',
      includeRules: true,
    })

    expect(prompt).toContain("Harry Potter and the Philosopher's Stone")
    expect(prompt).toContain('Chapter 1: The Boy Who Lived')
    expect(prompt).toContain('Direct Non-Interactive Mode')
    expect(prompt).toContain('Mr. Dursley was the director')
    expect(prompt).toContain('Mrs. Dursley was thin and blonde')
  })

  it('should parse actual Harry Potter EPUB archive if present', () => {
    const testEpubPath =
      'C:/Users/Mozi.DESKTOP-0CR3HGN/Downloads/Harry Potter and the Philosophers Stone 1 (J. K. Rowling) (z-library.sk, 1lib.sk, z-lib.sk).epub'

    if (fs.existsSync(testEpubPath)) {
      const buffer = fs.readFileSync(testEpubPath)
      const parsed = parseEpubBuffer(buffer, 220)

      expect(parsed.title).toContain('Harry Potter')
      expect(parsed.author.name).toContain('Rowling')
      expect(parsed.chapters.length).toBe(17)
      expect(parsed.totalPages).toBeGreaterThan(300)
      expect(parsed.pages[0].english).toBeTruthy()
      expect(parsed.pages[0].pageNumber).toBe(1)
    }
  })
})
