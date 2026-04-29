import { createClient } from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!
const apiVersion = '2023-05-03'

// Standard client for fetching data (public)
export const sanityClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: true, // Use CDN for faster reads
})

// Privileged client for mutations (requires write token)
export const sanityAdminClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false, // Don't use CDN for writes
    token: process.env.SANITY_API_WRITE_TOKEN, // Add this to .env.local
})
