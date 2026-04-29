/**
 * Rate Limiting Utility (Agent 2 - Performance & Security)
 * 
 * Simple in-memory rate limiter for API routes
 * For production, use Redis or Upstash Rate Limit
 */

interface RateLimitStore {
    [key: string]: {
        count: number
        resetTime: number
    }
}

const store: RateLimitStore = {}

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now()
    Object.keys(store).forEach(key => {
        if (store[key].resetTime < now) {
            delete store[key]
        }
    })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
    interval: number // Time window in milliseconds
    uniqueTokenPerInterval: number // Max requests per interval
}

export interface RateLimitResult {
    success: boolean
    limit: number
    remaining: number
    reset: number
}

/**
 * Rate limit checker
 * @param identifier - Unique identifier (IP, user ID, API key)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
function rateLimit(
    identifier: string,
    config: RateLimitConfig = {
        interval: 60 * 1000, // 1 minute
        uniqueTokenPerInterval: 10, // 10 requests per minute
    }
): RateLimitResult {
    const now = Date.now()
    const key = `${identifier}`

    if (!store[key] || store[key].resetTime < now) {
        store[key] = {
            count: 1,
            resetTime: now + config.interval,
        }

        return {
            success: true,
            limit: config.uniqueTokenPerInterval,
            remaining: config.uniqueTokenPerInterval - 1,
            reset: store[key].resetTime,
        }
    }

    store[key].count++

    const success = store[key].count <= config.uniqueTokenPerInterval

    return {
        success,
        limit: config.uniqueTokenPerInterval,
        remaining: Math.max(0, config.uniqueTokenPerInterval - store[key].count),
        reset: store[key].resetTime,
    }
}

/**
 * Get client identifier from request
 * @param request - Next.js request object
 * @returns Client identifier (IP or forwarded IP)
 */
function getClientIdentifier(request: Request): string {
    // Try to get real IP from headers (for proxies/load balancers)
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')

    if (forwarded) {
        return forwarded.split(',')[0].trim()
    }

    if (realIp) {
        return realIp
    }

    // Fallback to a generic identifier
    return 'unknown'
}

/**
 * Rate limit middleware for API routes
 * Usage:
 * ```ts
 * export async function POST(request: Request) {
 *   const rateLimitResult = await applyRateLimit(request)
 *   if (!rateLimitResult.success) {
 *     return NextResponse.json(
 *       { error: 'Too many requests' },
 *       { 
 *         status: 429,
 *         headers: {
 *           'X-RateLimit-Limit': rateLimitResult.limit.toString(),
 *           'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
 *           'X-RateLimit-Reset': rateLimitResult.reset.toString(),
 *         }
 *       }
 *     )
 *   }
 *   // ... rest of your code
 * }
 * ```
 */
export async function applyRateLimit(
    request: Request,
    config?: RateLimitConfig
): Promise<RateLimitResult> {
    const identifier = getClientIdentifier(request)
    return rateLimit(identifier, config)
}
