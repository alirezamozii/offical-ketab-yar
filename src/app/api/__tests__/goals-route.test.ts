import { beforeEach, expect, it, vi } from 'vitest'
import { db } from '@/lib/db'

vi.mock('@/lib/session', () => ({
  getOrCreateGuestId: async () => ({ id: 'guest', isNew: false }),
}))
vi.mock('@/lib/auth-session', () => ({ getCurrentUser: async () => ({ id: 'user' }) }))
vi.mock('@/lib/cms', () => ({
  getGoalsConfigFromDB: async () => ({
    daily: { target: 10, unit: 'pages' },
    weekly: { target: 70, unit: 'pages' },
    monthly: { target: 300, unit: 'pages' },
  }),
  getActiveMilestoneDefs: async () => [],
}))

import { GET } from '@/app/api/goals/route'

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.userGoal.findMany).mockResolvedValue([
    { period: 'daily', target: 25, unit: 'minutes' },
  ] as never)
  vi.mocked(db.userStats.upsert).mockResolvedValue(null)
  vi.mocked(db.vocabulary.count).mockResolvedValue(0)
})

it('returns identity-scoped saved goals over CMS defaults', async () => {
  const response = await GET()
  const body = await response.json()

  expect(db.userGoal.findMany).toHaveBeenCalledWith({
    where: { userId: 'user' },
    select: { period: true, target: true, unit: true },
  })
  expect(body.goals.daily).toEqual({ target: 25, unit: 'minutes' })
  expect(body.goals.weekly).toEqual({ target: 70, unit: 'pages' })
})
