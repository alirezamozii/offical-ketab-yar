import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config"

/**
 * Update Supabase session in middleware
 * Compatible with Next.js 16 proxy pattern
 * 
 * This function:
 * 1. Creates a Supabase client with cookie handling
 * 2. Validates the user session
 * 3. Refreshes tokens if needed
 * 4. Adds user state to response headers for downstream use
 */
export async function updateSession(request: NextRequest) {
  // Create response with request headers
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Early return if Supabase not configured
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return response
  }

  // Create Supabase client with cookie management
  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          // Update request cookies
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Create new response with updated cookies
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          // Set cookie in response
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options) {
          // Remove from request
          request.cookies.set({
            name,
            value: "",
            ...options,
          })
          // Create new response
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          // Remove from response
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    }
  )

  // Get user and validate session
  const { data: { user }, error } = await supabase.auth.getUser()

  // Add user state to response headers for downstream middleware/pages
  if (user && !error) {
    response.headers.set('x-middleware-supabase-user', user.id)
    response.headers.set('x-middleware-supabase-email', user.email || '')

    // Add user metadata if available
    if (user.user_metadata?.name) {
      response.headers.set('x-middleware-supabase-name', user.user_metadata.name)
    }
  }

  return response
}

/**
 * Check if user is authenticated from middleware response
 * Helper function for use in middleware.ts
 */
function isAuthenticated(response: NextResponse): boolean {
  return response.headers.has('x-middleware-supabase-user')
}

/**
 * Get user ID from middleware response
 * Helper function for use in middleware.ts
 */
function getUserId(response: NextResponse): string | null {
  return response.headers.get('x-middleware-supabase-user')
}
