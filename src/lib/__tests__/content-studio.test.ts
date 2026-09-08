import { describe, it, expect } from 'vitest'
import {
  AUTHOR_PROMPT,
  BOOK_INFO_PROMPT,
  BOOK_CONTENT_PAGES_PROMPT,
  FULL_BOOK_BUNDLE_PROMPT,
  BLOG_POST_PROMPT,
  QUOTES_PROMPT,
  ALL_AI_PROMPTS,
} from '@/payload/prompts/ai-prompts'

describe('AI Prompts & Schemas Validation Suite', () => {
  it('should have all 7 core prompt definitions configured', () => {
    expect(ALL_AI_PROMPTS.length).toBe(7)
    const ids = ALL_AI_PROMPTS.map((p) => p.id)
    expect(ids).toContain('author')
    expect(ids).toContain('book-info')
    expect(ids).toContain('book-content')
    expect(ids).toContain('full-bundle')
    expect(ids).toContain('blog-post')
    expect(ids).toContain('quotes')
    expect(ids).toContain('epub-batch')
  })

  it('should have valid JSON schemas in all sample JSONs', () => {
    // 1. Author sample
    expect(AUTHOR_PROMPT.sampleJson.name).toBeTruthy()
    expect(AUTHOR_PROMPT.sampleJson.slug).toBeTruthy()

    // 2. Book info sample
    expect(BOOK_INFO_PROMPT.sampleJson.title).toBeTruthy()
    expect(BOOK_INFO_PROMPT.sampleJson.level).toMatch(/^(A1|A2|B1|B2|C1|C2)$/)
    expect(Array.isArray(BOOK_INFO_PROMPT.sampleJson.genres)).toBe(true)

    // 3. Book content pages sample
    expect(BOOK_CONTENT_PAGES_PROMPT.sampleJson.bookSlug).toBeTruthy()
    expect(Array.isArray(BOOK_CONTENT_PAGES_PROMPT.sampleJson.chapters)).toBe(true)
    expect(Array.isArray(BOOK_CONTENT_PAGES_PROMPT.sampleJson.pages)).toBe(true)
    expect(BOOK_CONTENT_PAGES_PROMPT.sampleJson.pages[0].pageNumber).toBe(1)
    expect(BOOK_CONTENT_PAGES_PROMPT.sampleJson.pages[0].english).toBeTruthy()
    expect(BOOK_CONTENT_PAGES_PROMPT.sampleJson.pages[0].farsi).toBeTruthy()

    // 4. Full bundle sample
    expect(FULL_BOOK_BUNDLE_PROMPT.sampleJson.book.title).toBeTruthy()
    expect(FULL_BOOK_BUNDLE_PROMPT.sampleJson.author.name).toBeTruthy()
    expect(Array.isArray(FULL_BOOK_BUNDLE_PROMPT.sampleJson.pages)).toBe(true)

    // 5. Blog post sample
    expect(BLOG_POST_PROMPT.sampleJson.title).toBeTruthy()
    expect(BLOG_POST_PROMPT.sampleJson.content).toBeTruthy()
    expect(Array.isArray(BLOG_POST_PROMPT.sampleJson.tags)).toBe(true)

    // 6. Quotes sample
    expect(Array.isArray(QUOTES_PROMPT.sampleJson.quotes)).toBe(true)
    expect(QUOTES_PROMPT.sampleJson.quotes[0].text).toBeTruthy()
    expect(QUOTES_PROMPT.sampleJson.quotes[0].textFa).toBeTruthy()
  })

  it('should verify all prompt instructions enforce JSON output and CEFR rules', () => {
    expect(AUTHOR_PROMPT.systemPrompt).toContain('JSON')
    expect(BOOK_INFO_PROMPT.systemPrompt).toContain('CEFR')
    expect(BOOK_CONTENT_PAGES_PROMPT.systemPrompt).toContain('ترجمه')
    expect(FULL_BOOK_BUNDLE_PROMPT.systemPrompt).toContain('پکیج کامل')
    expect(BLOG_POST_PROMPT.systemPrompt).toContain('Markdown')
    expect(QUOTES_PROMPT.systemPrompt).toContain('نقل‌قول')
  })
})
