import { expect, it } from 'vitest'
import { compareReviews } from '@/lib/review-sort'

const reviews = [
  { id: 'low', rating: 1, createdAt: '2026-01-01' },
  { id: 'high', rating: 5, createdAt: '2026-01-02' },
  { id: 'middle', rating: 3, createdAt: '2026-01-03' },
]

it.each([
  ['highest', ['high', 'middle', 'low']],
  ['lowest', ['low', 'middle', 'high']],
  ['newest', ['middle', 'high', 'low']],
] as const)('sorts reviews by %s', (sort, expected) => {
  expect([...reviews].sort((a, b) => compareReviews(a, b, sort, {})).map(r => r.id)).toEqual(expected)
})

it('uses helpfulness, then recency, for equal ratings', () => {
  const sameRating = reviews.map(r => ({ ...r, rating: 5 }))
  const votes = { low: { up: 10, down: 1 } }
  expect(sameRating.sort((a, b) => compareReviews(a, b, 'highest', votes)).map(r => r.id)).toEqual(['low', 'middle', 'high'])
})
