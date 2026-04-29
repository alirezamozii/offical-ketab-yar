import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'
import { createClient } from 'next-sanity'

const sanityConfig = {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01', // Use current date
    useCdn: process.env.NODE_ENV === 'production', // CDN for production, direct for dev
    token: process.env.SANITY_API_TOKEN, // For preview mode
}

// Client for server-side data fetching (with draft mode support)
async function getClient(preview?: { isEnabled: boolean }) {
    const { isEnabled } = preview || { isEnabled: false }

    return createClient({
        ...sanityConfig,
        useCdn: !isEnabled,
        token: isEnabled ? sanityConfig.token : undefined,
        perspective: isEnabled ? 'previewDrafts' : 'published',
    })
}

// Client for server-side data fetching (legacy - without preview)
export const sanityClient = createClient(sanityConfig)

// Client for client-side data fetching (with CDN)
const sanityClientCDN = createClient({
    ...sanityConfig,
    useCdn: true,
})

// Image URL builder
const builder = imageUrlBuilder(sanityClient)

function urlFor(source: SanityImageSource) {
    return builder.image(source)
}

// Helper to get optimized image URL
export function getImageUrl(source: SanityImageSource, width?: number, height?: number) {
    let imageBuilder = urlFor(source).auto('format').fit('max')

    if (width) imageBuilder = imageBuilder.width(width)
    if (height) imageBuilder = imageBuilder.height(height)

    return imageBuilder.url()
}
