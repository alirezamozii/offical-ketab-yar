/**
 * src/lib/merge-guest-data.ts — re-parent guest-keyed rows to a signed-in user.
 *
 * Audit 04 (Database & API) §6.5 flagged the "server-as-hint-provider"
 * anti-pattern: collections, goals, reading history, achievement-unlock
 * timestamps, and per-user stats all lived ONLY in localStorage. The new
 * sync endpoints (`/api/{collections,goals,reading/history}/sync`) persist
 * those to the DB keyed on EITHER `userId` OR `guestId`.
 *
 * When a guest signs in, their guest-keyed rows must be RE-PARENTED to the
 * new `userId` so the data follows them across devices. This module does
 * that, idempotently:
 *
 *   1. For each guest-keyed row, upsert it under (userId, natural-key).
 *      If a row already exists for that user with the same natural key,
 *      take the MAX / most-recent value (so neither side loses data).
 *   2. Delete the guest-keyed rows after the user-keyed rows are in place.
 *
 * H-07 hardening:
 *   • The ENTIRE merge is wrapped in `db.$transaction(async (tx) => …)` so
 *     all reads and writes share the same connection and a single throw
 *     rolls everything back. A partial failure no longer leaves the data
 *     in an inconsistent state — the next signin attempt retries.
 *   • All guest rows are snapshot up front via `Promise.all([...])` inside
 *     the transaction, so reads happen on the same snapshot as the writes.
 *   • Re-parented user rows ALWAYS set `guestId: null` — never the old
 *     `guestId: 'user'` namespace-collapse bug (which collided with any
 *     real guest whose cookie happened to be the literal string "user").
 *   • Vote dedup: when re-parenting votes, if the user already has a vote
 *     on the same review, the guest dupe is deleted (keeping the user row)
 *     rather than triggering a unique-constraint violation.
 *   • Prisma errors re-throw as-is (so transaction rollback works); other
 *     errors are wrapped for clearer logging.
 *
 * Called from the NextAuth `signIn` callback (see `src/lib/auth.ts`) AND
 * from the `POST /api/auth/merge-guest` route (which the client can hit
 * manually after signin if the callback path fails).
 */

import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

/** Parse a JSON-encoded string[] safely — returns [] on any parse error. */
function parseStringArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(String)
  } catch {
    /* ignore */
  }
  return []
}

/** Parse a JSON-encoded number[24] safely — returns zero-filled array on error. */
function parseByHour(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length === 24) return parsed.map(Number)
  } catch {
    /* ignore */
  }
  return new Array(24).fill(0)
}

/**
 * Merge all guest-keyed data for `guestId` into the user `userId`.
 *
 * @returns a summary of how many rows were merged, for logging / display.
 */
export async function mergeGuestDataToUser(
  guestId: string,
  userId: string,
): Promise<{
  collections: number
  userGoals: number
  readingHistory: number
  achievements: number
  readingProgress: number
  readingSessions: number
  vocabulary: number
  votes: number
  userStats: boolean
}> {
  try {
    return await db.$transaction(async (tx) => {
      // ── Snapshot all guest rows UP FRONT (same transaction snapshot). ──
      // ReadingSession, Vocabulary, and Vote use bulk `updateMany` /
      // per-row dedup below, so they don't need snapshotting here — the
      // updateMany runs on the same transaction snapshot as these reads.
      const [
        guestCollections,
        guestGoals,
        guestHistory,
        guestAchievements,
        guestProgress,
        guestVotes,
        guestStats,
      ] = await Promise.all([
        tx.collection.findMany({ where: { guestId } }),
        tx.userGoal.findMany({ where: { guestId } }),
        tx.readingHistoryDayRow.findMany({ where: { guestId } }),
        tx.userAchievement.findMany({ where: { guestId } }),
        tx.readingProgress.findMany({ where: { guestId } }),
        tx.vote.findMany({ where: { guestId } }),
        tx.userStats.findUnique({ where: { guestId } }),
      ])

      // ── Collections ──────────────────────────────────────────────────
      // For each guest collection, upsert under (userId, name) — if a user
      // collection with the same name exists, merge bookSlugs (union).
      let collectionsMerged = 0
      for (const c of guestCollections) {
        const guestBookSlugs = parseStringArray(c.bookSlugs)
        const existing = await tx.collection.findUnique({
          where: { userId_name: { userId, name: c.name } },
        })

        if (existing) {
          // Merge bookSlugs (union, preserve order: existing first, then guest-new).
          const existingSlugs = parseStringArray(existing.bookSlugs)
          const merged = Array.from(new Set([...existingSlugs, ...guestBookSlugs]))
          await tx.collection.update({
            where: { id: existing.id },
            data: { bookSlugs: JSON.stringify(merged) },
          })
          // Delete the guest row — the user row is the canonical one now.
          await tx.collection.delete({ where: { id: c.id } })
        } else {
          // Re-parent the row directly: userId set, guestId cleared.
          await tx.collection.update({
            where: { id: c.id },
            data: { userId, guestId: null },
          })
        }
        collectionsMerged++
      }

      // ── UserGoal ─────────────────────────────────────────────────────
      // For each guest goal, upsert under (userId, period) — take the larger
      // target on conflict (more ambitious goal wins).
      let goalsMerged = 0
      for (const g of guestGoals) {
        const existing = await tx.userGoal.findUnique({
          where: { userId_period: { userId, period: g.period } },
        })
        if (existing) {
          await tx.userGoal.update({
            where: { id: existing.id },
            data: {
              target: Math.max(existing.target, g.target),
              unit: existing.unit,
            },
          })
          await tx.userGoal.delete({ where: { id: g.id } })
        } else {
          await tx.userGoal.update({
            where: { id: g.id },
            data: { userId, guestId: null },
          })
        }
        goalsMerged++
      }

      // ── ReadingHistoryDayRow ─────────────────────────────────────────
      // For each guest day, upsert under (userId, date) — take MAX pages /
      // seconds and per-hour MAX.
      let historyMerged = 0
      for (const h of guestHistory) {
        const guestByHour = parseByHour(h.byHour)
        const existing = await tx.readingHistoryDayRow.findUnique({
          where: { userId_date: { userId, date: h.date } },
        })
        if (existing) {
          const existingByHour = parseByHour(existing.byHour)
          const mergedByHour = guestByHour.map((v, i) => Math.max(v, existingByHour[i] || 0))
          await tx.readingHistoryDayRow.update({
            where: { id: existing.id },
            data: {
              pages: Math.max(existing.pages, h.pages),
              seconds: Math.max(existing.seconds, h.seconds),
              byHour: JSON.stringify(mergedByHour),
            },
          })
          await tx.readingHistoryDayRow.delete({ where: { id: h.id } })
        } else {
          await tx.readingHistoryDayRow.update({
            where: { id: h.id },
            data: { userId, guestId: null },
          })
        }
        historyMerged++
      }

      // ── UserAchievement ──────────────────────────────────────────────
      // For each guest unlock, upsert under (userId, achievementSlug). If
      // both exist, keep the EARLIEST unlockedAt (first time the achievement
      // was unlocked across either identity).
      let achievementsMerged = 0
      for (const a of guestAchievements) {
        const existing = await tx.userAchievement.findUnique({
          where: { userId_achievementSlug: { userId, achievementSlug: a.achievementSlug } },
        })
        if (existing) {
          const earliest = a.unlockedAt < existing.unlockedAt ? a.unlockedAt : existing.unlockedAt
          await tx.userAchievement.update({
            where: { id: existing.id },
            data: { unlockedAt: earliest },
          })
          // Delete the duplicate guest row.
          await tx.userAchievement.delete({ where: { id: a.id } })
        } else {
          await tx.userAchievement.update({
            where: { id: a.id },
            data: { userId, guestId: null },
          })
        }
        achievementsMerged++
      }

      // ── ReadingProgress ──────────────────────────────────────────────
      // For each guest progress row, upsert under (userId, bookSlug) — take
      // the higher currentPage (furthest-along reading position).
      let progressMerged = 0
      for (const p of guestProgress) {
        const existing = await tx.readingProgress.findUnique({
          where: { userId_bookSlug: { userId, bookSlug: p.bookSlug } },
        })
        if (existing) {
          const winner = p.currentPage >= existing.currentPage ? p : existing
          await tx.readingProgress.update({
            where: { id: existing.id },
            data: {
              currentPage: winner.currentPage,
              percent: winner.percent,
              lastReadAt: winner.lastReadAt,
            },
          })
          // Delete the duplicate guest row.
          await tx.readingProgress.delete({ where: { id: p.id } })
        } else {
          await tx.readingProgress.update({
            where: { id: p.id },
            data: { userId, guestId: null },
          })
        }
        progressMerged++
      }

      // ── ReadingSession (bulk re-parent) ──────────────────────────────
      // Reading sessions are append-only event rows; just re-parent them.
      // No natural-key uniqueness → no dedup needed.
      const sessionsUpdated = await tx.readingSession.updateMany({
        where: { guestId },
        data: { userId, guestId: null },
      })

      // ── Vocabulary (bulk re-parent) ──────────────────────────────────
      // Re-parent vocab words. (If a user already has the same word, we keep
      // both — dedup is a future enhancement; the `word` field isn't unique.)
      const vocabUpdated = await tx.vocabulary.updateMany({
        where: { guestId },
        data: { userId, guestId: null },
      })

      // ── Vote ─────────────────────────────────────────────────────────
      // For each guest vote, check if the user already has a vote on the
      // same review. If yes → keep the user row, delete the guest dupe
      // (avoids the @@unique([reviewId, userId]) collision). If no →
      // re-parent the guest vote row to the user.
      let votesMergedCount = 0
      for (const v of guestVotes) {
        const userVote = await tx.vote.findUnique({
          where: { reviewId_userId: { reviewId: v.reviewId, userId } },
          select: { id: true },
        })
        if (userVote) {
          // User already voted on this review — drop the guest dupe.
          await tx.vote.delete({ where: { id: v.id } })
        } else {
          // Re-parent: userId set, guestId cleared.
          await tx.vote.update({
            where: { id: v.id },
            data: { userId, guestId: null },
          })
        }
        votesMergedCount++
      }

      // ── UserStats ────────────────────────────────────────────────────
      // Merge the guest UserStats row into the user's row. Take the MAX of
      // each metric (XP, pagesRead, booksCompleted, streakDays) so neither
      // side loses progress. Keep the most recent lastReadAt.
      let userStatsMerged = false
      if (guestStats) {
        const userStats = await tx.userStats.findUnique({ where: { userId } })
        if (userStats) {
          await tx.userStats.update({
            where: { userId },
            data: {
              totalXP: Math.max(userStats.totalXP, guestStats.totalXP),
              level: Math.max(userStats.level, guestStats.level),
              pagesRead: Math.max(userStats.pagesRead, guestStats.pagesRead),
              booksCompleted: Math.max(userStats.booksCompleted, guestStats.booksCompleted),
              streakDays: Math.max(userStats.streakDays, guestStats.streakDays),
              lastReadAt:
                !userStats.lastReadAt || (guestStats.lastReadAt && guestStats.lastReadAt > userStats.lastReadAt)
                  ? guestStats.lastReadAt
                  : userStats.lastReadAt,
            },
          })
          // Delete the guest stats row.
          await tx.userStats.delete({ where: { guestId } })
        } else {
          // No user stats row yet — re-parent the guest row directly.
          await tx.userStats.update({
            where: { guestId },
            data: { userId, guestId: null },
          })
        }
        userStatsMerged = true
      }

      return {
        collections: collectionsMerged,
        userGoals: goalsMerged,
        readingHistory: historyMerged,
        achievements: achievementsMerged,
        readingProgress: progressMerged,
        readingSessions: sessionsUpdated.count,
        vocabulary: vocabUpdated.count,
        votes: votesMergedCount,
        userStats: userStatsMerged,
      }
    })
  } catch (err) {
    // Prisma errors re-throw as-is so transaction semantics are preserved
    // and the caller (NextAuth signIn callback / /api/auth/merge-guest
    // route) sees the original error code for retry decisions.
    if (err instanceof Prisma.PrismaClientKnownRequestError || err instanceof Prisma.PrismaClientUnknownRequestError) {
      throw err
    }
    // Wrap other errors for clearer logging — but preserve the original
    // via `cause` so debugging isn't lost.
    throw new Error(`mergeGuestDataToUser failed: ${err instanceof Error ? err.message : String(err)}`, {
      cause: err,
    })
  }
}
