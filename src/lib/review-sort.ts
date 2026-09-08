type Review = { id: string; rating: number; createdAt: string }
type VoteTotals = Record<string, { up: number; down: number }>

export function compareReviews(
  a: Review,
  b: Review,
  sort: 'newest' | 'highest' | 'lowest' | 'helpful',
  votes: VoteTotals,
): number {
  const newestFirst = () => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  if (sort === 'newest') return newestFirst()
  if ((sort === 'highest' || sort === 'lowest') && a.rating !== b.rating) {
    return sort === 'highest' ? b.rating - a.rating : a.rating - b.rating
  }
  const helpfulness = (id: string) => votes[id] ? votes[id].up - votes[id].down : 0
  return helpfulness(b.id) - helpfulness(a.id) || newestFirst()
}
