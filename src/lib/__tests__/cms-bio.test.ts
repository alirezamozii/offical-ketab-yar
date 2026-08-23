import { describe, it, expect } from 'vitest'
import { buildAuthorBio } from '../cms'

describe('buildAuthorBio', () => {
  it('returns null when author has no bio fields', () => {
    const res = buildAuthorBio({ name: 'Unknown Author' })
    expect(res).toBeNull()
  })

  it('builds AuthorBio correctly when bio is provided', () => {
    const author = {
      name: 'George Orwell',
      nameFa: 'جورج اورول',
      bio: 'English novelist and essayist.',
      bioFa: 'نویسنده انگلیسی',
      birthYear: 1903,
      deathYear: 1950,
      nationality: 'British',
      nationalityFa: 'بریتانیایی',
      flagEmoji: '🇬🇧',
      notableWorks: ['1984', 'Animal Farm'],
      era: 'Modern',
      eraFa: 'مدرن',
    }

    const res = buildAuthorBio(author)
    expect(res).not.toBeNull()
    expect(res?.name).toBe('George Orwell')
    expect(res?.nameFa).toBe('جورج اورول')
    expect(res?.notableWorks).toEqual(['1984', 'Animal Farm'])
    expect(res?.birthYear).toBe(1903)
    expect(res?.deathYear).toBe(1950)
  })

  it('handles notableWorks when passed as JSON string', () => {
    const author = {
      name: 'Jane Austen',
      bio: 'English novelist',
      notableWorks: JSON.stringify(['Pride and Prejudice', 'Emma']),
    }
    const res = buildAuthorBio(author)
    expect(res?.notableWorks).toEqual(['Pride and Prejudice', 'Emma'])
  })
})
