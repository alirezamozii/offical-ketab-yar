import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateGuestId } from '@/lib/session'

interface ActivityItem {
  id: string
  type: 'book_started' | 'book_completed' | 'vocab_learned' | 'level_up' | 'game_played' | 'review_posted' | 'social'
  message: string
  timestamp: number
  icon: string
  isCurrentUser: boolean
}

const MOCK_USERS = [
  { name: 'آرش رضایی', action: 'کتاب جدیدی شروع کرد', book: 'The Time Machine' },
  { name: 'سارا کریمی', action: 'به سطح ۱۰ رسید', book: '' },
  { name: 'محمد حسینی', action: 'یک بازی واژگان انجام داد', book: '' },
  { name: 'نگار احمدی', action: 'کتابی را تمام کرد', book: 'Peter Pan' },
  { name: 'رضا نوری', action: '۵ واژه جدید یاد گرفت', book: '' },
  { name: 'فاطمه علوی', action: 'نظری ثبت کرد', book: 'Pride and Prejudice' },
]

export async function GET(_req: NextRequest) {
  const { id: guestId } = await getOrCreateGuestId()
  const items: ActivityItem[] = []
  const now = Date.now()

  // 1. User's own activity from reading progress
  const progress = await db.readingProgress.findMany({
    where: { guestId },
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
    where: { guestId },
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
  const stats = await db.userStats.findUnique({ where: { guestId } }).catch(() => null)
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

  // 4. Mock social activity (other users)
  const mockCount = 6
  for (let i = 0; i < mockCount; i++) {
    const user = MOCK_USERS[i % MOCK_USERS.length]
    const ts = now - (i + 1) * 7200_000 - Math.random() * 3600_000
    const msg = user.book
      ? `${user.name} ${user.action}: «${user.book}»`
      : `${user.name} ${user.action}`
    items.push({
      id: `mock-${i}`,
      type: 'social',
      message: msg,
      timestamp: ts,
      icon: '👥',
      isCurrentUser: false,
    })
  }

  // Sort by timestamp descending
  items.sort((a, b) => b.timestamp - a.timestamp)

  return NextResponse.json({ items: items.slice(0, 15) })
}
