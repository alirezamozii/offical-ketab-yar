import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cache } from '@/lib/cache'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

beforeEach(() => cache.clear())

describe('cache concurrency and eviction', () => {
  it('deduplicates concurrent producers', async () => {
    const fn = vi.fn().mockResolvedValue('value')
    expect(await Promise.all([cache.wrap('key', fn, 1000), cache.wrap('key', fn, 1000)])).toEqual(['value', 'value'])
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it.each(['delete', 'clear'] as const)('does not restore stale data after %s', async (operation) => {
    const pending = deferred<string>()
    const old = cache.wrap('key', () => pending.promise, 1000)
    if (operation === 'delete') cache.delete('key')
    else cache.clear()
    await cache.wrap('key', async () => 'fresh', 1000)
    pending.resolve('stale')
    expect(await old).toBe('stale')
    expect(cache.get('key')).toBe('fresh')
  })

  it('preserves an explicit write while an older producer completes', async () => {
    const pending = deferred<string>()
    const old = cache.wrap('key', () => pending.promise, 1000)
    cache.set('key', 'fresh', 1000)
    pending.resolve('stale')
    await old
    expect(cache.get('key')).toBe('fresh')
  })

  it('does not remove a replacement producer when an invalidated one rejects', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    const old = cache.wrap('key', () => first.promise, 1000)
    const rejection = expect(old).rejects.toThrow('failed')
    cache.delete('key')
    const fn = vi.fn(() => second.promise)
    const fresh = cache.wrap('key', fn, 1000)
    first.reject(new Error('failed'))
    await rejection
    const shared = cache.wrap('key', fn, 1000)
    second.resolve('fresh')
    await Promise.all([fresh, shared])
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries synchronous producer failures', async () => {
    await expect(cache.wrap('key', () => { throw new Error('failed') }, 1000)).rejects.toThrow('failed')
    expect(await cache.wrap('key', async () => 'fresh', 1000)).toBe('fresh')
  })

  it('evicts the least recently used entry instead of a frequently read one', () => {
    for (let i = 0; i < 1000; i++) cache.set(String(i), i, 60_000)
    cache.get('0')
    cache.set('new', 1000, 60_000)
    expect(cache.get('0')).toBe(0)
    expect(cache.get('1')).toBeUndefined()
  })
})
