import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

vi.mock('@/lib/session', () => ({ getEffectiveOwner: async () => ({ userId: 'reader', guestId: null }) }))
import { POST } from '@/app/api/reading/progress/route'

describe('reading progress accounting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.readingProgress.findUnique).mockResolvedValue({ currentPage: 10 } as never)
    vi.mocked(db.readingProgress.upsert).mockResolvedValue({ currentPage: 11 } as never)
    vi.mocked(db.readingSession.findFirst).mockResolvedValue({ id: 'today' } as never)
  })
  const save = (currentPage: number) => POST(new NextRequest('http://localhost/api/reading/progress', {
    method: 'POST', body: JSON.stringify({ bookSlug: 'book', currentPage, totalPages: 30, prevPage: 0 }),
  }))

  it('counts one newly read page, ignoring the forged previous position', async () => {
    expect((await save(11)).status).toBe(200)
    expect(db.readingSession.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ pagesRead: { increment: 1 } }),
    }))
  })

  it('does not recount an identical saved position', async () => {
    await save(10)
    expect(db.readingSession.update).not.toHaveBeenCalled()
    expect(db.readingSession.create).not.toHaveBeenCalled()
  })

  it('reports failure when activity cannot be committed', async () => {
    vi.mocked(db.readingSession.update).mockRejectedValueOnce(new Error('database unavailable'))
    expect((await save(11)).status).toBe(500)
  })
})
