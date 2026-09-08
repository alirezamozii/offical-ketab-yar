import { expect, it } from 'vitest'
import { canDeleteContent } from '@/payload/access'

it.each([
  [{ role: 'owner' }, true],
  [{ role: 'admin' }, true],
  [{ role: 'editor' }, false],
  [{}, false],
  [null, false],
  ['admin', false],
] as const)('checks CMS delete access defensively for %j', (user, expected) => {
  expect(canDeleteContent(user)).toBe(expected)
})
