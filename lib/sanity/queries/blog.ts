/**
 * Sanity CMS Blog Queries
 * Agent 1 (SEO) - Blog for content marketing and long-tail keywords
 * Agent 3 (Psychology) - Keep users engaged between reading sessions
 */

import { sanityClient } from '../client'
import type { BlogPost } from '../types'

/**
 * Get all published blog posts
 */
export async function getAllBlogPosts(limit?: number): Promise<BlogPost[]> {
    const query = `*[_type == "blogPost" && publishedAt <= now()] | order(publishedAt desc) ${limit ? `[0...${limit}]` : ''} {
        _id,
        "slug": slug.current,
        title,
        summary,
        mainImage {
            asset->{
                _id,
                url
            },
            alt
        },
        author->{
            _id,
            name,
            bio,
            image {
                asset->{
                    _id,
                    url
                }
            }
        },
        categories,
        publishedAt,
        featured,
        "estimatedReadingTime": round(length(pt::text(body.en)) / 5 / 180)
    }`

    try {
        const posts = await sanityClient.fetch<BlogPost[]>(query)
        return posts || []
    } catch (error) {
        console.error('Error fetching blog posts:', error)
        return []
    }
}

/**
 * Get blog post by slug
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const query = `*[_type == "blogPost" && slug.current == $slug && publishedAt <= now()][0] {
        _id,
        "slug": slug.current,
        title,
        summary,
        body,
        mainImage {
            asset->{
                _id,
                url
            },
            alt
        },
        author->{
            _id,
            name,
            bio,
            image {
                asset->{
                    _id,
                    url
                }
            }
        },
        categories,
        relatedBooks[]->{
            _id,
            "slug": slug.current,
            title,
            coverImage {
                asset->{
                    _id,
                    url
                }
            },
            author->{
                name
            }
        },
        publishedAt,
        featured,
        "estimatedReadingTime": round(length(pt::text(body.en)) / 5 / 180)
    }`

    try {
        const post = await sanityClient.fetch<BlogPost | null>(query, { slug })
        return post
    } catch (error) {
        console.error('Error fetching blog post:', error)
        return null
    }
}

/**
 * Get featured blog posts
 */
export async function getFeaturedBlogPosts(limit: number = 3): Promise<BlogPost[]> {
    const query = `*[_type == "blogPost" && featured == true && publishedAt <= now()] | order(publishedAt desc) [0...${limit}] {
        _id,
        "slug": slug.current,
        title,
        summary,
        mainImage {
            asset->{
                _id,
                url
            },
            alt
        },
        author->{
            _id,
            name
        },
        categories,
        publishedAt,
        "estimatedReadingTime": round(length(pt::text(body.en)) / 5 / 180)
    }`

    try {
        const posts = await sanityClient.fetch<BlogPost[]>(query)
        return posts || []
    } catch (error) {
        console.error('Error fetching featured blog posts:', error)
        return []
    }
}

/**
 * Get blog posts by category
 */
async function getBlogPostsByCategory(category: string, limit?: number): Promise<BlogPost[]> {
    const query = `*[_type == "blogPost" && $category in categories && publishedAt <= now()] | order(publishedAt desc) ${limit ? `[0...${limit}]` : ''} {
        _id,
        "slug": slug.current,
        title,
        summary,
        mainImage {
            asset->{
                _id,
                url
            },
            alt
        },
        author->{
            _id,
            name
        },
        categories,
        publishedAt,
        "estimatedReadingTime": round(length(pt::text(body.en)) / 5 / 180)
    }`

    try {
        const posts = await sanityClient.fetch<BlogPost[]>(query, { category })
        return posts || []
    } catch (error) {
        console.error('Error fetching blog posts by category:', error)
        return []
    }
}

/**
 * Get related blog posts (same categories)
 */
export async function getRelatedBlogPosts(currentSlug: string, categories: string[], limit: number = 3): Promise<BlogPost[]> {
    const query = `*[_type == "blogPost" && slug.current != $currentSlug && count((categories[])[@ in $categories]) > 0 && publishedAt <= now()] | order(publishedAt desc) [0...${limit}] {
        _id,
        "slug": slug.current,
        title,
        summary,
        mainImage {
            asset->{
                _id,
                url
            },
            alt
        },
        author->{
            _id,
            name
        },
        categories,
        publishedAt,
        "estimatedReadingTime": round(length(pt::text(body.en)) / 5 / 180)
    }`

    try {
        const posts = await sanityClient.fetch<BlogPost[]>(query, { currentSlug, categories })
        return posts || []
    } catch (error) {
        console.error('Error fetching related blog posts:', error)
        return []
    }
}

/**
 * Get all blog post slugs (for static generation)
 */
export async function getAllBlogPostSlugs(): Promise<string[]> {
    const query = `*[_type == "blogPost" && publishedAt <= now()].slug.current`

    try {
        const slugs = await sanityClient.fetch<string[]>(query)
        return slugs || []
    } catch (error) {
        console.error('Error fetching blog post slugs:', error)
        return []
    }
}
