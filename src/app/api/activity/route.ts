import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getEffectiveOwner } from '@/lib/session'

interface ActivityItem {
  id: string
  type: 'book_started' | 'book_completed' | 'vocab_learned' | 'level_up' | 'game_played' | 'review_posted' | 'social'
  message: string
  timestamp: number
  icon: string
  isCurrentUser: boolean
}

export async function GET() {
  const owner = await getEffectiveOwner()
  const where = owner.userId ? { userId: owner.userId } : { guestId: owner.guestId! }
  const items: ActivityItem[] = []
  const now = Date.now()

  // 1. User's own activity from reading progress
  const progress = await db.readingProgress.findMany({
    where,
    select: { bookSlug: true, percent: true, lastReadAt: true },
    take: 5,
    orderBy: { lastReadAt: 'desc' },
  }).catch(() => [])

  const books = progress.length
    ? await db.book.findMany({
        where: { slug: { in: progress.map((p) => p.bookSlug) } },
        select: { slug: true, title: true },
      }).catch(() => [])
    : []

  const bookMap = new Map(books.map((b) => [b.slug, b.title]))

  for (const p of progress) {
    const title = bookMap.get(p.bookSlug) || p.bookSlug
    if (p.percent >= 100) {
      items.push({
        id: `self-complete-${p.bookSlug}`,
        type: 'book_completed',
        message: `شما کتاب «${title}» را تمام کردید`,
        timestamp: p.lastReadAt.getTime(),
        icon: '🏆',
        isCurrentUser: true,
      })
    } else if (p.percent > 0) {
      items.push({
        id: `self-start-${p.bookSlug}`,
        type: 'book_started',
        message: `شما کتاب «${title}» را شروع کردید`,
        timestamp: p.lastReadAt.getTime(),
        icon: '📖',
        isCurrentUser: true,
      })
    }
  }

  // 2. User's vocabulary count
  const vocabCount = await db.vocabulary.count({
    where,
  }).catch(() => 0)

  if (vocabCount > 0) {
    items.push({
      id: 'self-vocab',
      type: 'vocab_learned',
      message: `شما ${vocabCount} واژه ذخیره کرده‌اید`,
      timestamp: now - 3600_000,
      icon: '📚',
      isCurrentUser: true,
    })
  }

  // 3. User's XP/level
  const stats = await db.userStats.findUnique({ where }).catch(() => null)
  if (stats && stats.totalXP > 0) {
    items.push({
      id: 'self-level',
      type: 'level_up',
      message: `شما به سطح ${stats.level} رسیدید (${stats.totalXP} XP)`,
      timestamp: stats.updatedAt.getTime(),
      icon: '⚡',
      isCurrentUser: true,
    })
  }

  // Sort by timestamp descending
  items.sort((a, b) => b.timestamp - a.timestamp)

  return NextResponse.json({ items: items.slice(0, 15) }, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
