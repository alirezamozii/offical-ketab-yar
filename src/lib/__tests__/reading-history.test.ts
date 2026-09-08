import { beforeEach, expect, it, vi } from 'vitest'
import { readReadingHistory, recordReadingDay, syncReadingHistory } from '@/lib/goals'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

it('accumulates page and active-time data in the same local day', () => {
  recordReadingDay({ date: '2026-09-06', pagesDelta: 2 })
  recordReadingDay({ date: '2026-09-06', secondsDelta: 15, hour: 21 })

  expect(readReadingHistory()).toEqual([expect.objectContaining({
    date: '2026-09-06',
    pages: 2,
    seconds: 15,
    byHour: expect.arrayContaining([15]),
  })])
  expect(readReadingHistory()[0].byHour[21]).toBe(15)
})

it('syncs history with credentials through the current request context', async () => {
  recordReadingDay({ date: '2026-09-06', pagesDelta: 1 })
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))

  await syncReadingHistory(true)

  expect(fetchMock).toHaveBeenCalledWith('/api/reading/history/sync', expect.objectContaining({
    method: 'POST',
    keepalive: true,
    body: expect.stringContaining('2026-09-06'),
  }))
})

it('surfaces server failures while keeping local history intact', async () => {
  recordReadingDay({ date: '2026-09-06', pagesDelta: 1 })
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 503 }))

  await expect(syncReadingHistory()).rejects.toThrow('503')
  expect(readReadingHistory()[0].pages).toBe(1)
})
