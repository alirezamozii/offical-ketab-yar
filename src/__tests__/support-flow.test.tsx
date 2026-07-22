import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextRequest } from 'next/server'
import { POST as supportPOST } from '@/app/api/support/route'
import { db } from '@/lib/db'

// ── Mock sonner.toast ───────────────────────────────────────────────────────
const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}))

// ── Mock @/lib/auth-session — guest mode (no signed-in user) ────────────────
vi.mock('@/lib/auth-session', () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
  getSession: vi.fn().mockResolvedValue(null),
}))

// ── Mock @/lib/rate-limit — bypass rate limiting (crypto.subtle unavailable in jsdom)
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: () => ({ ok: true, retryAfter: 0, remaining: 999 }),
  getClientIpHash: () => Promise.resolve('test-ip-hash'),
  rateLimitKey: (...parts: string[]) => parts.join(':'),
}))

// ── Mock @/lib/db — the API route's `db` import is replaced with a mock
vi.mock('@/lib/db', () => ({
  db: {
    supportTicket: {
      create: vi.fn().mockResolvedValue({ id: 'ticket_test_1', createdAt: new Date('2024-06-01T12:00:00Z') }),
    },
  },
}))

describe('Unit: /api/support POST handler — direct invocation', () => {
  // These tests call the POST handler directly (no jsdom fetch stub needed).
  // The handler uses createHash from node:crypto (not crypto.subtle) so it
  // works in the vitest jsdom environment.

  beforeEach(() => {
    vi.mocked(db.supportTicket.create).mockClear()
    vi.mocked(db.supportTicket.create).mockResolvedValue({
      id: 'ticket_test_1',
      name: 'Alice',
      email: 'alice@example.com',
      subject: 'subject',
      message: 'message',
      status: 'OPEN',
      reply: '',
      userAgent: '',
      ipHash: 'test-ip-hash',
      createdAt: new Date('2024-06-01T12:00:00Z'),
      updatedAt: new Date('2024-06-01T12:00:00Z'),
      userId: null,
    })
  })

  function makeReq(body: unknown, ip = '203.0.113.1'): NextRequest {
    return new NextRequest('http://localhost:3000/api/support', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    })
  }

  it('creates a ticket with trimmed + lowercased fields and returns 201', async () => {
    const res = await supportPOST(makeReq({
      name: '  Alice  ',
      email: '  Alice@Example.COM  ',
      subject: '  Reader bug  ',
      message: '  The reader does not load page 3.  ',
    }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.id).toBe('ticket_test_1')

    // Verify the handler called db.create with trimmed data.
    expect(vi.mocked(db.supportTicket.create)).toHaveBeenCalledTimes(1)
    const arg = vi.mocked(db.supportTicket.create).mock.calls[0][0]
    expect(arg.data.name).toBe('Alice')
    expect(arg.data.email).toBe('alice@example.com')
    expect(arg.data.subject).toBe('Reader bug')
    expect(arg.data.message).toBe('The reader does not load page 3.')
    expect(arg.data.userId).toBeNull() // guest mode
    expect(arg.data.ipHash).toBeTruthy() // sha256 hash of IP
  })

  it('returns 400 when a field is too short (zod validation)', async () => {
    const res = await supportPOST(makeReq({
      name: 'A', // too short (min 2)
      email: 'a@b.com',
      subject: 'subject',
      message: 'a long enough message',
    }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeTruthy()
    expect(json.details).toBeTruthy() // zod field errors
    expect(vi.mocked(db.supportTicket.create)).not.toHaveBeenCalled()
  })

  it('returns 400 when email is invalid', async () => {
    const res = await supportPOST(makeReq({
      name: 'Alice',
      email: 'not-an-email',
      subject: 'subject',
      message: 'a long enough message',
    }))
    expect(res.status).toBe(400)
    expect(vi.mocked(db.supportTicket.create)).not.toHaveBeenCalled()
  })

  it('returns 500 with Persian message when db.create throws', async () => {
    vi.mocked(db.supportTicket.create).mockRejectedValueOnce(new Error('db down'))
    const res = await supportPOST(makeReq({
      name: 'Alice',
      email: 'alice@example.com',
      subject: 'subject',
      message: 'a long enough message',
    }))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toContain('ثبت') // Persian error message
  })

  it('hashes the IP with SHA-256 (64-char hex)', async () => {
    await supportPOST(makeReq({
      name: 'Alice',
      email: 'alice@example.com',
      subject: 'subject',
      message: 'a long enough message',
    }, '198.51.100.42'))
    const arg = vi.mocked(db.supportTicket.create).mock.calls[0][0]
    // SHA-256 produces a 64-char hex string.
    expect(arg.data.ipHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('rate-limits after 5 tickets from the same IP (429)', async () => {
    // Submit 5 valid tickets from the same IP.
    for (let i = 0; i < 5; i++) {
      const res = await supportPOST(makeReq({
        name: `User${i}`,
        email: `u${i}@example.com`,
        subject: `subject ${i}`,
        message: `message body ${i} long enough`,
      }, '203.0.113.99'))
      expect(res.status).toBe(201)
    }
    // The 6th ticket from the same IP should be rate-limited (429).
    const res = await supportPOST(makeReq({
      name: 'User6',
      email: 'u6@example.com',
      subject: 'subject 6',
      message: 'message body 6 long enough',
    }, '203.0.113.99'))
    expect(res.status).toBe(429)
    const json = await res.json()
    expect(json.error).toMatch(/حداکثر|بیش از حد|مجاز/)
    expect(res.headers.get('retry-after')).toBeTruthy()
  })
})

/**
 * Lightweight integration test — BookCard navigation contract.
 *
 * Verifies the home → book-detail navigation contract: a BookCard's
 * stretched link points to /books/<slug>, and clicking the favorite
 * button does NOT navigate (it stops propagation).
 *
 * This is a "navigation flow" integration test per the FINAL-5 brief's
 * fallback option ("if the reader flow is too complex, write a simpler
 * integration test for the home → library → book detail navigation flow").
 */
import { BookCard } from '@/components/books/book-card'
import type { BookListItem } from '@/lib/data'

vi.mock('next/image', () => ({
  default: ({ src, alt = '', ...rest }: { src: string; alt?: string } & Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...rest} />
  },
}))

const toggleMock = vi.fn()
const isFavoriteMock = vi.fn(() => false)
vi.mock('@/hooks/reader/use-favorites', () => ({
  useFavorites: () => ({
    favorites: {},
    list: [],
    isFavorite: isFavoriteMock,
    toggle: toggleMock,
    loaded: true,
  }),
}))

const sampleBook: BookListItem = {
  id: 'b1',
  slug: 'the-great-gatsby',
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  description: '',
  coverFrom: '#f0d6a0',
  coverTo: '#9b6a2e',
  coverAccent: '#fff',
  genres: ['Classic'],
  level: 'B2',
  rating: 4.5,
  reviewCount: 5,
  viewCount: 100,
  pageCount: 180,
  isPremium: false,
  publishedYear: 1925,
}

describe('Integration: home → book-detail navigation flow', () => {
  beforeEach(() => {
    toggleMock.mockReset()
    isFavoriteMock.mockReset()
    isFavoriteMock.mockReturnValue(false)
  })

  it('BookCard renders with the correct detail-page link', () => {
    render(<BookCard book={sampleBook} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/books/the-great-gatsby')
  })

  it('BookCard renders with a progress indicator when progress > 0', () => {
    const { container } = render(<BookCard book={sampleBook} progress={50} />)
    // The progress ribbon width is "50%".
    const bar = container.querySelector('[style*="width: 50%"]')
    expect(bar).not.toBeNull()
  })

  it('BookCard "Continue" CTA shows for in-progress books (1-99%)', () => {
    render(<BookCard book={sampleBook} progress={42} />)
    expect(screen.getByText('ادامه')).toBeInTheDocument()
  })

  it('FavoriteButton click does NOT navigate away (stops propagation)', async () => {
    const user = userEvent.setup()
    render(<BookCard book={sampleBook} />)
    const favBtn = screen.getByLabelText('افزودن به علاقه‌مندی')
    await user.click(favBtn)
    // toggle was called → the favorite action ran.
    expect(toggleMock).toHaveBeenCalledTimes(1)
    // The router mock's push should NOT have been called because the
    // favorite button stops propagation. (next/navigation is mocked at
    // the setup level with vi.fn()s we can introspect via the module.)
    const nav = (await import('next/navigation')) as unknown as {
      useRouter: () => { push: ReturnType<typeof vi.fn> }
    }
    expect(nav.useRouter().push).not.toHaveBeenCalled()
  })

  it('renders multiple BookCards in a grid (library page contract)', () => {
    render(
      <div role="list">
        <BookCard book={sampleBook} />
        <BookCard
          book={{ ...sampleBook, slug: 'alice', title: 'Alice' }}
        />
      </div>,
    )
    const cards = screen.getAllByRole('link')
    expect(cards.length).toBe(2)
    expect(cards[0]).toHaveAttribute('href', '/books/the-great-gatsby')
    expect(cards[1]).toHaveAttribute('href', '/books/alice')
  })
})
