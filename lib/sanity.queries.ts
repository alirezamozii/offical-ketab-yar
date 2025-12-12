import { sanityAdminClient, sanityClient } from './sanity.client'

// Get all published books (for public pages)
export async function getPublishedBooks() {
    const books = await sanityClient.fetch(
        `*[_type == "compactBook" && status == 'published'] | order(_createdAt desc) {
      _id,
      title,
      titleFa,
      slug,
      "author": author->{
        _id,
        name,
        bio,
        nationality,
        photo
      },
      coverImage,
      summary,
      summaryFa,
      "genres": genres[]->{
        _id,
        name,
        nameFa,
        color
      },
      level,
      status,
      featured
    }`
    )
    return books
}

// Get a single published book by slug (for public pages)
export async function getPublishedBook(slug: string) {
    const book = await sanityClient.fetch(
        `*[_type == "compactBook" && slug.current == $slug && status == 'published'][0] {
      _id,
      title,
      titleFa,
      slug,
      "author": author->{
        _id,
        name,
        bio,
        nationality,
        photo
      },
      coverImage,
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
      seoTitle,
      seoDescription
    }`,
        { slug }
    )
    return book
}

// Get a draft book by slug (for preview mode - requires admin token)
export async function getDraftBook(slug: string) {
    const book = await sanityAdminClient.fetch(
        `*[_type == "compactBook" && slug.current == $slug][0] {
      _id,
      title,
      titleFa,
      slug,
      "author": author->{
        _id,
        name,
        bio,
        nationality,
        photo
      },
      coverImage,
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
      status
    }`,
        { slug }
    )
    return book
}

// Get all books (for admin panel)
export async function getAllBooks() {
    const books = await sanityAdminClient.fetch(
        `*[_type == "compactBook"] | order(_createdAt desc) {
      _id,
      title,
      titleFa,
      slug,
      "author": author->{
        _id,
        name
      },
      status,
      featured,
      _createdAt
    }`
    )
    return books
}

// Get a single book by ID (for admin editing)
export async function getBookById(id: string) {
    const book = await sanityAdminClient.fetch(
        `*[_type == "compactBook" && _id == $id][0]`,
        { id }
    )
    return book
}

// Get all unique genres from all books
export async function getAllGenres() {
    const genres = await sanityClient.fetch(
        `*[_type == "genre"] | order(name asc) {
      _id,
      name,
      nameFa,
      description,
      color
    }`
    )
    return genres
}

// Get all authors
export async function getAllAuthors() {
    const authors = await sanityClient.fetch(
        `*[_type == "author"] | order(name asc) {
      _id,
      name,
      bio,
      nationality,
      photo
    }`
    )
    return authors
}
