import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getFullyCachedBooks, prefetchBook } from '@/lib/book-prefetcher'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  fetchMock.mockReset().mockImplementation(async () => new Response('{}'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

it('only marks a book complete after every chunk succeeds', async () => {
  const progress = vi.fn()
  const download = prefetchBook('alice', 'Alice', 21, progress)
  await vi.runAllTimersAsync()
  await download
  expect(fetchMock.mock.calls.map(([url]) => url)).toContain('/api/books/alice/pages?from=21&to=21')
  expect(getFullyCachedBooks()).toEqual(['alice'])
  expect(progress).toHaveBeenLastCalledWith(100)
  expect(localStorage.getItem('ky_reader_session_history')).toBeNull()
})

it.each(['details', 'reader', 'chunk'] as const)('does not report completion when %s fails', async (stage) => {
  fetchMock.mockImplementation(async (input) => {
    const url = String(input)
    const fails = stage === 'details' ? url === '/api/books/alice'
      : stage === 'reader' ? url === '/books/read/alice' : url.includes('/pages?')
    return new Response('{}', { status: fails ? 503 : 200 })
  })
  const progress = vi.fn()
  await expect(prefetchBook('alice', 'Alice', 20, progress)).rejects.toThrow('Failed to prefetch')
  expect(getFullyCachedBooks()).toEqual([])
  expect(progress).not.toHaveBeenCalledWith(100)
})

it('propagates a network failure so the download button can show an error', async () => {
  fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
  await expect(prefetchBook('alice', 'Alice', 20)).rejects.toThrow('Failed to fetch')
  expect(getFullyCachedBooks()).toEqual([])
})

it.each([0, -1, NaN, Infinity, 1.5])('rejects invalid page count %s before requesting anything', async (pageCount) => {
  await expect(prefetchBook('alice', 'Alice', pageCount)).rejects.toThrow('valid page count')
  expect(fetchMock).not.toHaveBeenCalled()
})
