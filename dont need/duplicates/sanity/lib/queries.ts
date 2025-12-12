import { groq } from 'next-sanity'

// Book queries
export const booksQuery = groq`
  *[_type == "book" && status == "published"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    subtitle,
    summary,
    "coverImage": coverImage.asset->url,
    "author": author->{name, slug},
    genres[]->{name, slug},
    language,
    totalPages,
    freePreviewPages,
    featured,
    premium,
    publicationYear
  }
`

export const bookBySlugQuery = groq`
  *[_type == "book" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    subtitle,
    summary,
    "coverImage": coverImage.asset->url,
    "author": author->{name, slug, bio, "photo": photo.asset->url},
    genres[]->{name, slug},
    language,
    totalPages,
    freePreviewPages,
    contentEnglish,
    contentPersian,
    featured,
    premium,
    publicationYear,
    isbn,
    publisher,
    status
  }
`

export const featuredBooksQuery = groq`
  *[_type == "book" && status == "published" && featured == true] | order(publishedAt desc) [0...10] {
    _id,
    title,
    slug,
    subtitle,
    summary,
    "coverImage": coverImage.asset->url,
    "author": author->{name, slug},
    genres[]->{name, slug},
    language,
    totalPages,
    premium
  }
`

// Author queries
export const authorsQuery = groq`
  *[_type == "author"] | order(name asc) {
    _id,
    name,
    slug,
    bio,
    "photo": photo.asset->url,
    birthYear,
    nationality
  }
`

export const authorBySlugQuery = groq`
  *[_type == "author" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    bio,
    "photo": photo.asset->url,
    birthYear,
    nationality,
    "books": *[_type == "book" && references(^._id) && status == "published"] {
      _id,
      title,
      slug,
      "coverImage": coverImage.asset->url,
      publicationYear
    }
  }
`

// Genre queries
export const genresQuery = groq`
  *[_type == "genre"] | order(name asc) {
    _id,
    name,
    slug,
    description
  }
`

export const booksByGenreQuery = groq`
  *[_type == "book" && status == "published" && $genreId in genres[]._ref] {
    _id,
    title,
    slug,
    subtitle,
    summary,
    "coverImage": coverImage.asset->url,
    "author": author->{name, slug},
    genres[]->{name, slug},
    language,
    totalPages,
    premium
  }
`

// Blog queries
export const blogPostsQuery = groq`
  *[_type == "blogPost" && status == "published"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    "coverImage": coverImage.asset->url,
    "author": author->{name, slug},
    publishedAt
  }
`

export const blogPostBySlugQuery = groq`
  *[_type == "blogPost" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    "coverImage": coverImage.asset->url,
    content,
    "author": author->{name, slug, bio, "photo": photo.asset->url},
    publishedAt,
    status
  }
`
