import { groq } from 'next-sanity'
import { sanityClient } from './client'
import type { Author, SanityBook, SanityBookListItem } from './types'

// ============================================
// BOOK QUERIES (Updated for compactBook schema)
// ============================================

export const booksQuery = groq`
  *[_type == "compactBook" && status == "published"] | order(_createdAt desc) {
    _id,
    "slug": slug.current,
    title,
    titleFa,
    "coverImage": coverImage.asset->url,
    "author": author->{
      _id,
      name,
      bio,
      nationality,
      "photo": photo.asset->url
    },
    summary,
    summaryFa,
    "genres": genres[]->{
      _id,
      name,
      nameFa,
      color
    },
    level,
    featured,
    _createdAt
  }
`

export const bookBySlugQuery = groq`
  *[_type == "compactBook" && slug.current == $slug && status == "published"][0] {
    _id,
    "slug": slug.current,
    title,
    titleFa,
    "coverImage": coverImage.asset->url,
    "author": author->{
      _id,
      name,
      bio,
      nationality,
      "photo": photo.asset->url
    },
    summary,
    summaryFa,
    "genres": genres[]->{
      _id,
      name,
      nameFa,
      color
    },
    level,
    bookData,
    featured,
    seoTitle,
    seoDescription,
    _createdAt
  }
`

export const bookSlugsQuery = groq`
  *[_type == "compactBook" && status == "published"] {
    "slug": slug.current
  }
`

export const featuredBooksQuery = groq`
  *[_type == "compactBook" && featured == true && status == "published"] | order(_createdAt desc) [0...6] {
    _id,
    "slug": slug.current,
    title,
    titleFa,
    "coverImage": coverImage.asset->url,
    "author": author->{
      name
    },
    summary,
    summaryFa,
    "genres": genres[]->{
      name,
      nameFa,
      color
    },
    level
  }
`

export const booksByGenreQuery = groq`
  *[_type == "compactBook" && $genreId in genres[]._ref && status == "published"] | order(_createdAt desc) [0...$limit] {
    _id,
    "slug": slug.current,
    title,
    titleFa,
    "coverImage": coverImage.asset->url,
    "author": author->name,
    "genres": genres[]->name,
    level
  }
`

// ============================================
// AUTHOR QUERIES
// ============================================

export const authorsQuery = groq`
  *[_type == "author"] | order(name asc) {
    _id,
    name,
    "photo": photo.asset->url,
    nationality,
    bio
  }
`

export const authorByIdQuery = groq`
  *[_type == "author" && _id == $id][0] {
    _id,
    name,
    "photo": photo.asset->url,
    nationality,
    bio,
    "books": *[_type == "compactBook" && author._ref == ^._id && status == "published"] | order(_createdAt desc) {
      _id,
      "slug": slug.current,
      title,
      titleFa,
      "coverImage": coverImage.asset->url,
      summary,
      "genres": genres[]->name
    }
  }
`

export const authorBySlugQuery = groq`
  *[_type == "author" && slug.current == $slug][0] {
    _id,
    name,
    "photo": photo.asset->url,
    nationality,
    bio,
    "books": *[_type == "compactBook" && author._ref == ^._id && status == "published"] | order(_createdAt desc) {
      _id,
      "slug": slug.current,
      title,
      titleFa,
      "coverImage": coverImage.asset->url,
      summary,
      "genres": genres[]->name
    }
  }
`

// ============================================
// GENRE QUERIES
// ============================================

export const genresQuery = groq`
  *[_type == "genre"] | order(name asc) {
    _id,
    name,
    nameFa,
    description,
    color
  }
`

// ============================================
// QUERY FUNCTIONS
// ============================================

/**
 * Get all published books
 */
export async function getAllBooks(): Promise<SanityBookListItem[]> {
  try {
    return await sanityClient.fetch(booksQuery)
  } catch (error) {
    console.error('Error fetching all books:', error)
    return []
  }
}

/**
 * Get book by slug
 */
export async function getBookBySlug(slug: string): Promise<SanityBook | null> {
  try {
    return await sanityClient.fetch(bookBySlugQuery, { slug })
  } catch (error) {
    console.error('Error fetching book by slug:', error)
    return null
  }
}

/**
 * Get book by ID
 */
export async function getBookById(id: string): Promise<SanityBook | null> {
  try {
    const query = groq`*[_type == "compactBook" && _id == $id][0] {
      _id,
      "slug": slug.current,
      title,
      titleFa,
      "coverImage": coverImage.asset->url,
      "author": author->{
        _id,
        name,
        bio
      },
      summary,
      summaryFa,
      "genres": genres[]->{
        name,
        nameFa,
        color
      },
      level,
      bookData,
      status,
      featured
    }`
    return await sanityClient.fetch(query, { id })
  } catch (error) {
    console.error('Error fetching book by ID:', error)
    return null
  }
}

/**
 * Get recently added books
 */
export async function getRecentlyAddedBooks(limit: number = 12): Promise<SanityBookListItem[]> {
  try {
    const query = groq`
      *[_type == "compactBook" && status == "published"] | order(_createdAt desc) [0...$limit] {
        _id,
        "slug": slug.current,
        title,
        titleFa,
        "coverImage": coverImage.asset->url,
        "author": author->{
          name
        },
        summary,
        summaryFa,
        "genres": genres[]->{
          name,
          nameFa,
          color
        },
        level,
        featured
      }
    `
    return await sanityClient.fetch(query, { limit })
  } catch (error) {
    console.error('Error fetching recently added books:', error)
    return []
  }
}

/**
 * Get featured books
 */
export async function getFeaturedBooks(limit: number = 6): Promise<SanityBookListItem[]> {
  try {
    const query = groq`
      *[_type == "compactBook" && featured == true && status == "published"] | order(_createdAt desc) [0...$limit] {
        _id,
        "slug": slug.current,
        title,
        titleFa,
        "coverImage": coverImage.asset->url,
        "author": author->{
          name
        },
        summary,
        summaryFa,
        "genres": genres[]->{
          name,
          nameFa,
          color
        },
        level,
        featured
      }
    `
    return await sanityClient.fetch(query, { limit })
  } catch (error) {
    console.error('Error fetching featured books:', error)
    return []
  }
}

/**
 * Get books by genre
 */
export async function getBooksByGenre(genreId: string, limit: number = 12): Promise<SanityBookListItem[]> {
  try {
    return await sanityClient.fetch(booksByGenreQuery, { genreId, limit })
  } catch (error) {
    console.error('Error fetching books by genre:', error)
    return []
  }
}

/**
 * Get author by ID
 */
export async function getAuthorById(id: string): Promise<Author | null> {
  try {
    return await sanityClient.fetch(authorByIdQuery, { id })
  } catch (error) {
    console.error('Error fetching author by ID:', error)
    return null
  }
}

/**
 * Get all genres
 */
export async function getAllGenres() {
  try {
    return await sanityClient.fetch(genresQuery)
  } catch (error) {
    console.error('Error fetching genres:', error)
    return []
  }
}

/**
 * Get all authors
 */
export async function getAllAuthors() {
  try {
    return await sanityClient.fetch(authorsQuery)
  } catch (error) {
    console.error('Error fetching authors:', error)
    return []
  }
}
