import { updateSession } from "@/lib/supabase/middleware"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Next.js 16+ Middleware with Proxy Export Pattern
 * 
 * This middleware handles:
 * 1. Authentication & Session Management (Supabase)
 * 2. Route Protection (Private vs Public)
 * 3. Development Mode Flexibility
 * 
 * Architecture:
 * - Public Zone (SSG): /, /books/[slug], /about, /auth/* - No auth required
 * - Private Zone (CSR): /dashboard, /profile, /vocabulary, /library/* - Auth required
 */

// Define route patterns
// Agent 3 (Psychology): Force login for ALL features (even free ones)
// This creates account dependency and enables proper freemium tracking
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/help',
  '/blog',
  '/books', // Book detail pages ONLY (SSG) - NOT the reader
  '/auth/login',
  '/auth/register',
  '/auth/error',
  '/auth/callback',
  '/auth/verify',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/offline',
  '/api/auth', // Auth API routes
]

// Protected routes that require authentication
// Agent 3 (Psychology): Make features accessible without login to lower barrier
// Only truly private features require auth
const PROTECTED_ROUTES = [
  '/profile', // Personal profile requires auth
  '/subscription', // Payment requires auth
  '/admin', // Admin panel requires auth
  // Note: /dashboard, /library, /vocabulary, /settings, /books/read work without auth
  // They use offline storage and sync when user logs in
]

const ADMIN_ROUTES = [
  '/admin',
  '/Studio',
]

/**
 * Main middleware function using Next.js 16 proxy pattern
 */
async function proxy(request: NextRequest) {
  const { pathname, origin } = request.nextUrl

  // 1. Skip middleware for static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('/api/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|otf)$/)
  ) {
    return NextResponse.next()
  }

  // 2. Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    // Exact match for root routes
    if (route === pathname) return true

    // Special handling for /books - allow /books/[slug] but NOT /books/read/[slug]
    if (route === '/books') {
      return pathname.startsWith('/books/') && !pathname.startsWith('/books/read/')
    }

    // Other routes with subpaths
    return pathname.startsWith(`${route}/`)
  })

  // 3. Check if route is protected (requires auth)
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // 4. Check if route is admin
  const isAdminRoute = ADMIN_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // 5. Check Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isSupabaseConfigured = supabaseUrl &&
    supabaseKey &&
    supabaseUrl !== 'your_supabase_url_here' &&
    !supabaseUrl.includes('placeholder') &&
    supabaseKey !== 'placeholder_anon_key_here' &&
    !supabaseKey.includes('placeholder')

  // 6. Development mode: Allow all routes if Supabase not configured
  // This allows testing the app without authentication setup
  if (!isSupabaseConfigured) {
    return NextResponse.next()
  }

  // 7. Public routes: Always allow (no auth needed)
  if (isPublicRoute) {
    // Still update session for public routes (for user state)
    if (isSupabaseConfigured) {
      return await updateSession(request)
    }
    return NextResponse.next()
  }

  // 8. Protected routes: Require authentication
  if (isProtectedRoute && isSupabaseConfigured) {
    const response = await updateSession(request)

    // Check if user is authenticated
    const supabaseResponse = response.headers.get('x-middleware-supabase-user')
    const isAuthenticated = supabaseResponse !== null

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', origin)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Admin routes: Additional check for admin role
    if (isAdminRoute) {
      // TODO: Add admin role check here when user roles are implemented
      // For now, just check authentication
    }

    return response
  }

  // 9. All other routes: Allow access (works offline with IndexedDB)
  // Agent 3 (Psychology): Lower barrier to entry, sync when user logs in
  if (isSupabaseConfigured) {
    return await updateSession(request)
  }

  return NextResponse.next()
}

/**
 * Export middleware function
 * Note: Next.js 16 shows a deprecation warning suggesting 'proxy' export,
 * but still requires 'middleware' export for now.
 */
export const middleware = proxy

/**
 * Middleware configuration
 * Defines which routes should run through middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (public files)
     * - Static assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)",
  ],
}
