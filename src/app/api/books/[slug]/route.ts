import { NextRequest, NextResponse } from 'next/server'
import { getBookBySlug } from '@/lib/data'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

const payloadGet = REST_GET(config)
const payloadPatch = REST_PATCH(config)
const payloadDelete = REST_DELETE(config)
const payloadPut = REST_PUT(config)
const payloadPost = REST_POST(config)
const payloadOptions = REST_OPTIONS(config)

/**
 * GET /api/books/[slug]
 * Bridges Payload CMS document fetching with application slug fetching.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'شناسه کتاب نامعتبر است.' },
        { status: 400 }
      )
    }

    const isPayloadId = /^\d+$/.test(slug)
    const url = new URL(req.url)
    const isPayloadQuery = url.searchParams.has('depth') || url.searchParams.has('draft')

    if (isPayloadId || isPayloadQuery) {
      return (payloadGet as any)(req, {
        params: Promise.resolve({ slug: ['books', slug] }),
      })
    }

    const book = await getBookBySlug(slug)

    if (!book) {
      return (payloadGet as any)(req, {
        params: Promise.resolve({ slug: ['books', slug] }),
      })
    }

    return NextResponse.json(book, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    })
  } catch (err) {
    console.error('[/api/books/[slug]] Error:', err)
    return NextResponse.json(
      { error: 'کتاب مورد نظر یافت نشد.' },
      { status: 404 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  return (payloadPatch as any)(req, {
    params: Promise.resolve({ slug: ['books', slug] }),
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  return (payloadDelete as any)(req, {
    params: Promise.resolve({ slug: ['books', slug] }),
  })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  return (payloadPut as any)(req, {
    params: Promise.resolve({ slug: ['books', slug] }),
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  return (payloadPost as any)(req, {
    params: Promise.resolve({ slug: ['books', slug] }),
  })
}

export async function OPTIONS(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  return (payloadOptions as any)(req, {
    params: Promise.resolve({ slug: ['books', slug] }),
  })
}

