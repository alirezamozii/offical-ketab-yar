import { NextResponse } from 'next/server'
import {
  CHALLENGE_POOL,
  pickDailyChallenges,
  dateKey,
  type ChallengeDef,
} from '@/lib/gamification'

export interface DailyChallengeResponse {
  date: string
  challenges: ChallengeDef[]
  pool: ChallengeDef[]
}

/**
 * GET /api/challenges — returns today's 3 rotating daily challenges.
 * Deterministic per date (no DB write) so all users see the same set on a
 * given day. The full pool is returned alongside so the client can render
 * contextual help / tooltips for any challenge.
 */
export async function GET() {
  const today = new Date()
  const challenges = pickDailyChallenges(today)
  const payload: DailyChallengeResponse = {
    date: dateKey(today),
    challenges,
    pool: CHALLENGE_POOL,
  }
  return NextResponse.json(payload)
}
