import { describe, it, expect } from 'vitest'
import { normalizePages, parseAnyJsonPayload } from '@/payload/components/action-helpers'

describe('parseAnyJsonPayload & normalizePages with en/fa aliases', () => {
  it('parses en/fa keys correctly in normalizePages', () => {
    const raw = [
      { pageNumber: 1, en: 'Hello world', fa: 'سلام دنیا' },
      { pageNumber: 2, english: 'Page 2', farsi: 'صفحه ۲' },
    ]
    const normalized = normalizePages(raw)
    expect(normalized[0].english).toBe('Hello world')
    expect(normalized[0].farsi).toBe('سلام دنیا')
    expect(normalized[1].english).toBe('Page 2')
    expect(normalized[1].farsi).toBe('صفحه ۲')
  })

  it('handles concatenated multi-chunk JSON ({...} {...})', () => {
    const chunk1 = JSON.stringify({
      bookSlug: 'harry-potter',
      pages: [{ pageNumber: 1, en: 'P1', fa: 'ص۱' }],
    })
    const chunk2 = JSON.stringify({
      bookSlug: 'harry-potter',
      pages: [{ pageNumber: 2, en: 'P2', fa: 'ص۲' }],
    })
    const combinedRaw = `${chunk1} ${chunk2}`

    const parsed = parseAnyJsonPayload(combinedRaw)
    expect(parsed.bookSlug).toBe('harry-potter')
    expect(parsed.pages.length).toBe(2)
    expect(parsed.pages[0].en).toBe('P1')
    expect(parsed.pages[1].en).toBe('P2')
  })
})
