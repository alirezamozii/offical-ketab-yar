import 'server-only'

import { client } from './client'
import {
    authorBySlugQuery,
    authorsQuery,
    blogPostBySlugQuery,
    blogPostsQuery,
    bookBySlugQuery,
    booksByGenreQuery,
    booksQuery,
    featuredBooksQuery,
    genresQuery,
} from './queries'

// Books
export async function getBooks() {
    return client.fetch(booksQuery)
}

export async function getBookBySlug(slug: string) {
    return client.fetch(bookBySlugQuery, { slug })
}

export async function getFeaturedBooks() {
    return client.fetch(featuredBooksQuery)
}

// Authors
export async function getAuthors() {
    return client.fetch(authorsQuery)
}

export async function getAuthorBySlug(slug: string) {
    return client.fetch(authorBySlugQuery, { slug })
}

// Genres
export async function getGenres() {
    return client.fetch(genresQuery)
}

export async function getBooksByGenre(genreId: string) {
    return client.fetch(booksByGenreQuery, { genreId })
}

// Blog
export async function getBlogPosts() {
    return client.fetch(blogPostsQuery)
}

export async function getBlogPostBySlug(slug: string) {
    return client.fetch(blogPostBySlugQuery, { slug })
}
