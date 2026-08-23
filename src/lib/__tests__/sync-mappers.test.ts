import { describe, it, expect } from 'vitest'
import {
  mapAuthorPayloadToPrisma,
  mapBookPayloadToPrisma,
  extractBlogContent,
  mapBlogPostPayloadToPrisma,
} from '../../payload/sync'

describe('sync mappers', () => {
  describe('mapAuthorPayloadToPrisma', () => {
    it('maps full author payload to Prisma format', () => {
      const doc = {
        slug: 'jane-austen',
        name: 'Jane Austen',
        nameFa: 'جین آستن',
        bio: 'English novelist',
        bioFa: 'نویسنده انگلیسی',
        photo: { url: 'http://img.jpg', blurhash: 'L123' },
        birthYear: 1775,
        deathYear: 1817,
        nationality: 'British',
        nationalityFa: 'بریتانیایی',
        flagEmoji: '🇬🇧',
        era: 'Romantic',
        eraFa: 'رمانتیک',
        notableWorks: ['Pride and Prejudice', 'Emma'],
        biography: 'Full bio',
        biographyFa: 'بیوگرافی کامل',
        tags: ['classic', 'romance'],
        website: 'https://janeausten.org',
        wikipedia: 'https://en.wikipedia.org/wiki/Jane_Austen',
        featured: true,
      }

      const result = mapAuthorPayloadToPrisma(doc)
      expect(result.slug).toBe('jane-austen')
      expect(result.photoUrl).toBe('http://img.jpg')
      expect(result.photoBlurhash).toBe('L123')
      expect(result.notableWorks).toBe(JSON.stringify(['Pride and Prejudice', 'Emma']))
      expect(result.tags).toBe(JSON.stringify(['classic', 'romance']))
      expect(result.featured).toBe(true)
    })

    it('handles missing/empty optional author fields', () => {
      const doc = {
        slug: 'unknown',
        name: 'Unknown Author',
      }

      const result = mapAuthorPayloadToPrisma(doc)
      expect(result.photoUrl).toBe('')
      expect(result.photoBlurhash).toBe('')
      expect(result.birthYear).toBeNull()
      expect(result.deathYear).toBeNull()
      expect(result.notableWorks).toBe('[]')
      expect(result.featured).toBe(false)
    })
  })

  describe('mapBookPayloadToPrisma', () => {
    it('maps book payload doc to Prisma structure', () => {
      const doc = {
        slug: 'pride-and-prejudice',
        title: 'Pride and Prejudice',
        description: 'Classic romance',
        coverFrom: '#b8956a',
        coverTo: '#6d523a',
        coverAccent: '#f4d35e',
        coverImage: { url: 'http://cover.jpg', blurhash: 'L456' },
        genres: ['Romance', 'Classic'],
        level: 'B2',
        language: 'en',
        rating: 4.8,
        reviewCount: 120,
        viewCount: 1500,
        pageCount: 350,
        isPremium: false,
        isPublished: true,
        publishedYear: 1813,
        allowDownload: true,
      }

      const result = mapBookPayloadToPrisma(doc, 'author-123')
      expect(result.authorId).toBe('author-123')
      expect(result.title).toBe('Pride and Prejudice')
      expect(result.coverImageUrl).toBe('http://cover.jpg')
      expect(result.coverBlurhash).toBe('L456')
      expect(result.genres).toBe(JSON.stringify(['Romance', 'Classic']))
      expect(result.rating).toBe(4.8)
    })
  })

  describe('extractBlogContent & mapBlogPostPayloadToPrisma', () => {
    it('extracts lexical root content object as JSON string', () => {
      const doc = { content: { root: { children: [] } } }
      expect(extractBlogContent(doc)).toBe(JSON.stringify(doc.content))
    })

    it('extracts string content directly', () => {
      expect(extractBlogContent({ content: 'Hello world' })).toBe('Hello world')
      expect(extractBlogContent({})).toBe('')
    })

    it('maps blog post payload to Prisma format', () => {
      const doc = {
        slug: 'test-post',
        title: 'Test Post',
        excerpt: 'Summary',
        cover: { url: 'http://cover.jpg', blurhash: 'L789' },
        tags: ['tech', 'news'],
        _status: 'published',
        publishedAt: '2026-01-01T00:00:00.000Z',
        viewCount: 42,
      }

      const result = mapBlogPostPayloadToPrisma(doc, 'user-1', 'Body text')
      expect(result.slug).toBe('test-post')
      expect(result.authorId).toBe('user-1')
      expect(result.content).toBe('Body text')
      expect(result.coverUrl).toBe('http://cover.jpg')
      expect(result.published).toBe(true)
      expect(result.publishedAt).toBeInstanceOf(Date)
    })
  })
})
