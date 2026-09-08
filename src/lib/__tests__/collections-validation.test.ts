import { beforeEach, expect, it } from 'vitest'
import { DEFAULT_COLLECTIONS, readCollections } from '@/lib/collections'

beforeEach(() => localStorage.clear())

it('discards collection records with unsafe presentation values', () => {
  localStorage.setItem('ky_collections', JSON.stringify([
    {
      id: 'broken',
      name: 'Broken',
      description: '',
      bookSlugs: ['book'],
      color: 'not-a-color',
      icon: 'not-an-icon',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]))

  expect(readCollections().map((collection) => collection.id)).toEqual(
    DEFAULT_COLLECTIONS.map((collection) => collection.id),
  )
})

it('rejects non-string book slugs before they reach collection components', () => {
  localStorage.setItem('ky_collections', JSON.stringify([
    {
      ...DEFAULT_COLLECTIONS[0],
      bookSlugs: ['valid', 42],
    },
  ]))

  expect(readCollections().every((collection) =>
    collection.bookSlugs.every((slug) => typeof slug === 'string'),
  )).toBe(true)
})
