import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { JWT } from 'next-auth/jwt'
import { db } from '@/lib/db'

vi.mock('@/lib/env', () => ({ env: {} }))
vi.mock('@auth/prisma-adapter', () => ({ PrismaAdapter: () => ({}) }))
vi.mock('@/lib/session', () => ({ getGuestId: vi.fn() }))
vi.mock('@/lib/merge-guest-data', () => ({ mergeGuestDataToUser: vi.fn() }))
import { authOptions } from '@/lib/auth'

const jwt = authOptions.callbacks!.jwt!
const update = (token: JWT, session: object = {}) => jwt({
  token, trigger: 'update', session,
} as Parameters<typeof jwt>[0])

describe('session revocation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('revokes a deleted administrator and ignores a client role update', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
    const token = await update({ id: 'deleted-admin', role: 'ADMIN' }, { role: 'OWNER' })
    expect(token.id).toBeUndefined()
    expect(token.role).toBe('USER')
    expect(token.banned).toBe(true)
  })

  it('takes roles from the database, never the update payload', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ role: 'USER', banned: false } as never)
    expect((await update({ id: 'user' }, { role: 'OWNER' })).role).toBe('USER')
  })

  it('clears a stale ban after the user is unbanned', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ role: 'USER', banned: false } as never)
    expect((await update({ id: 'user', banned: true })).banned).toBe(false)
  })
})
