import { describe, it, expect } from 'vitest'
import { generateBookPalette } from '@/lib/book-palette'
import { buildBookData } from '@/payload/components/action-helpers'

describe('Intelligent Book Palette Generator Suite', () => {
  it('should automatically generate high-contrast luxury palettes based on genre & title', () => {
    // Classic genre
    const classic = generateBookPalette('Pride and Prejudice', ['Classic', 'Literature'])
    expect(classic.coverFrom).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(classic.coverTo).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(classic.coverAccent).toMatch(/^#[0-9a-fA-F]{6}$/)

    // Adventure genre
    const adventure = generateBookPalette('Treasure Island', ['Adventure', 'Action'])
    expect(adventure.coverFrom).toBeTruthy()
    expect(adventure.coverTo).toBeTruthy()
    expect(adventure.coverAccent).toBeTruthy()

    // Fantasy genre
    const fantasy = generateBookPalette('Alice in Wonderland', ['Fantasy', 'Fairy Tale'])
    expect(fantasy.coverFrom).toBeTruthy()
    expect(fantasy.coverTo).toBeTruthy()

    // Mystery genre
    const mystery = generateBookPalette('Sherlock Holmes', ['Mystery', 'Detective'])
    expect(mystery.coverFrom).toBeTruthy()
    expect(mystery.coverAccent).toBeTruthy()
  })

  it('should generate deterministic colors for the same title', () => {
    const pal1 = generateBookPalette('The Great Gatsby', ['Classic'])
    const pal2 = generateBookPalette('The Great Gatsby', ['Classic'])
    expect(pal1.coverFrom).toBe(pal2.coverFrom)
    expect(pal1.coverTo).toBe(pal2.coverTo)
    expect(pal1.coverAccent).toBe(pal2.coverAccent)
  })

  it('should automatically populate coverFrom, coverTo, coverAccent in buildBookData when omitted', () => {
    const rawJson = {
      title: 'Moby Dick',
      genres: ['Adventure'],
      description: 'The whale story',
    }
    const bookData = buildBookData(rawJson, 'moby-dick', 'author-123', [], [])
    expect(bookData.coverFrom).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(bookData.coverTo).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(bookData.coverAccent).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(bookData.pageCount).toBe(0)
  })
})
