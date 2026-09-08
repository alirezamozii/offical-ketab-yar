'use server'

import { headers } from 'next/headers'
import { Prisma } from '@prisma/client'
import { db } from '../../lib/db'
import { slugify } from '../../lib/utils'
import { revalidateUsers, revalidateBook } from '../../lib/revalidate'
import { getVerifiedAdminUser } from '@/lib/auth-session'
import {
  normalizePages,
  normalizeChapters,
  parseAuthorNameAndInput,
  buildBookData,
} from './action-helpers'

export interface CallerAdminInfo {
  id: string
  role: 'owner' | 'admin' | 'editor'
  email?: string | null
}

/**
 * Verify caller is an authorized Admin or Owner in either Payload CMS or NextAuth.
 */
async function assertAdminPermission(requireOwner = false): Promise<CallerAdminInfo> {
  // 1. Check Payload CMS authenticated user
  try {
    const { getPayloadClient } = await import('../../lib/payload')
    const payload = await getPayloadClient()
    const reqHeaders = await headers()
    const { user: payloadUser } = await payload.auth({ headers: reqHeaders })
    if (payloadUser) {
      const normalizedRole: 'owner' | 'admin' | 'editor' =
        payloadUser.role === 'owner' ? 'owner' : payloadUser.role === 'admin' ? 'admin' : 'editor'
      if (normalizedRole === 'editor') {
        throw new Error('دسترسی غیرمجاز. این عملیات به نقش مدیر نیاز دارد.')
      }
      if (requireOwner && normalizedRole !== 'owner') {
        throw new Error('تنها مالک اصلی پنل (Owner) مجاز به انجام این عملیات است.')
      }
      return { id: String(payloadUser.id), role: normalizedRole, email: payloadUser.email }
    }
  } catch (err: any) {
    if (err?.message?.includes('مالک اصلی')) throw err
  }

  // 2. Check NextAuth session user
  const nextAuthUser = await getVerifiedAdminUser()
  if (nextAuthUser) {
    const normalizedRole: 'owner' | 'admin' | 'editor' =
      nextAuthUser.role === 'OWNER' ? 'owner' : nextAuthUser.role === 'ADMIN' ? 'admin' : 'editor'
    if (requireOwner && normalizedRole !== 'owner') {
      throw new Error('تنها مالک اصلی پنل (Owner) مجاز به انجام این عملیات است.')
    }
    if (nextAuthUser.role === 'OWNER' || nextAuthUser.role === 'ADMIN') {
      return { id: nextAuthUser.id, role: normalizedRole, email: nextAuthUser.email }
    }
  }

  throw new Error('دسترسی غیرمجاز. شما باید به عنوان مدیر وارد شده باشید.')
}

/**
 * Get current admin's role ('owner' | 'admin' | 'editor').
 */
export async function getCurrentAdminRole(): Promise<'owner' | 'admin' | 'editor'> {
  try {
    const caller = await assertAdminPermission(false)
    return caller.role
  } catch {
    return 'editor'
  }
}

/**
 * Interface representing dashboard metrics.
 */
export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalReadingSessions: number
  totalPagesRead: number
  totalMinutesRead: number
  totalDownloads: number
  openTickets: number
  averagePagesPerUser: number
}

/**
 * Fetch operational and user statistics from the Prisma database.
 */
export async function fetchStats(): Promise<DashboardStats> {
  await assertAdminPermission(false)
  try {
    const [
      totalUsers,
      activeUsers,
      totalReadingSessions,
      readingSessionsAgg,
      totalDownloads,
      openTickets,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { onboardingCompleted: true } }),
      db.readingSession.count(),
      db.readingSession.aggregate({
        _sum: {
          pagesRead: true,
          minutesRead: true,
        },
      }),
      db.bookDownload.count(),
      db.supportTicket.count({ where: { status: 'OPEN' } }),
    ])

    const totalPagesRead = readingSessionsAgg._sum.pagesRead || 0
    const totalMinutesRead = readingSessionsAgg._sum.minutesRead || 0
    const averagePagesPerUser = totalUsers > 0 ? Math.round(totalPagesRead / totalUsers) : 0

    return {
      totalUsers,
      activeUsers,
      totalReadingSessions,
      totalPagesRead,
      totalMinutesRead,
      totalDownloads,
      openTickets,
      averagePagesPerUser,
    }
  } catch (err) {
    console.error('[Actions] Failed to fetch stats:', err)
    throw new Error('Failed to load database stats.')
  }
}

/**
 * Interface for user representation in user manager.
 */
export interface ManagedUser {
  id: string
  name: string | null
  username: string | null
  email: string | null
  image: string | null
  role: string
  banned: boolean
  banReason: string | null
  bannedAt: Date | null
  createdAt: Date
  englishLevel: string | null
  onboardingCompleted: boolean
  stats: {
    reviewsCount: number
    progressCount: number
    downloadsCount: number
    sessionsCount: number
    vocabulariesCount: number
    achievementsCount: number
    xp: number
    level: number
    streakDays: number
    booksCompleted: number
    totalMinutesRead: number
  }
}

/**
 * Search website users in the Prisma database.
 */
export async function searchUsers(query: string): Promise<ManagedUser[]> {
  await assertAdminPermission(false)
  try {
    const q = query.trim()
    const where: Prisma.UserWhereInput = {}
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ]
    }

    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        role: true,
        banned: true,
        banReason: true,
        bannedAt: true,
        createdAt: true,
        englishLevel: true,
        onboardingCompleted: true,
        userStats: {
          select: {
            totalXP: true,
            level: true,
            streakDays: true,
            booksCompleted: true,
            pagesRead: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            readingProgress: true,
            bookDownloads: true,
            readingSessions: true,
            vocabularies: true,
            achievements: true,
          },
        },
      },
    })

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      image: u.image,
      role: u.role,
      banned: u.banned,
      banReason: u.banReason,
      bannedAt: u.bannedAt,
      createdAt: u.createdAt,
      englishLevel: u.englishLevel,
      onboardingCompleted: u.onboardingCompleted,
      stats: {
        reviewsCount: u._count.reviews,
        progressCount: u._count.readingProgress,
        downloadsCount: u._count.bookDownloads,
        sessionsCount: u._count.readingSessions,
        vocabulariesCount: u._count.vocabularies,
        achievementsCount: u._count.achievements,
        xp: u.userStats?.totalXP || 0,
        level: u.userStats?.level || 1,
        streakDays: u.userStats?.streakDays || 0,
        booksCompleted: u.userStats?.booksCompleted || 0,
        totalMinutesRead: u.userStats?.pagesRead ? Math.round(u.userStats.pagesRead * 1.5) : 0,
      },
    }))
  } catch (err) {
    console.error('[Actions] Failed to search users:', err)
    throw new Error('Failed to retrieve user list.')
  }
}

/**
 * Promote or change a user's role (Owner only).
 * Rules:
 * - Only OWNER can change roles.
 * - Cannot demote an OWNER account unless done by another owner.
 */
export async function updateUserRole(userId: string, role: string) {
  const caller = await assertAdminPermission(true)
  try {
    if (!['USER', 'ADMIN', 'OWNER'].includes(role)) {
      throw new Error('نقش مشخص شده نامعتبر است.')
    }

    const target = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
    })

    if (!target) {
      throw new Error('کاربر مورد نظر در سیستم یافت نشد.')
    }

    // Safety: prevent owner from accidentally demoting own account
    if (target.role === 'OWNER' && role !== 'OWNER' && target.email === caller.email) {
      throw new Error('شما نمی‌توانید نقش حساب مالک اصلی خود را تنزل دهید.')
    }

    await db.user.update({
      where: { id: userId },
      data: { role },
    })
    revalidateUsers()
    return { success: true }
  } catch (err) {
    console.error(`[Actions] Failed to update user role for ${userId}:`, err)
    throw err instanceof Error ? err : new Error('Failed to update user role.')
  }
}

/**
 * Ban / suspend a user.
 * STRICT ENFORCEMENT RULES:
 * 1. NO ONE can ban an OWNER.
 * 2. ADMIN cannot ban ADMIN or OWNER.
 * 3. OWNER can ban ADMIN or USER.
 */
export async function banUser(userId: string, reason: string) {
  const caller = await assertAdminPermission(false)
  try {
    const target = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
    })

    if (!target) {
      throw new Error('کاربر مورد نظر در سیستم یافت نشد.')
    }

    // Rule 1: No one can ban an OWNER
    if (target.role === 'OWNER') {
      throw new Error('حساب مالک اصلی سیستم (Owner) تحت هیچ شرایطی قابل مسدودسازی نیست.')
    }

    // Rule 2: Admin cannot ban another Admin
    if (caller.role !== 'owner' && target.role === 'ADMIN') {
      throw new Error('مدیران عادی اجازه مسدودسازی سایر مدیران را ندارند. تنها مالک اصلی سیستم مجاز به مسدودسازی مدیر است.')
    }

    const cleanReason = reason.trim() || 'نقض قوانین وب‌سایت'
    await db.user.update({
      where: { id: userId },
      data: {
        banned: true,
        banReason: cleanReason,
        bannedAt: new Date(),
      },
    })
    revalidateUsers()
    return { success: true }
  } catch (err) {
    console.error(`[Actions] Failed to ban user ${userId}:`, err)
    throw err instanceof Error ? err : new Error('Failed to ban user.')
  }
}

/**
 * Unban / restore a user.
 * Rules:
 * - Admin can unban USER.
 * - Only OWNER can unban an ADMIN.
 */
export async function unbanUser(userId: string) {
  const caller = await assertAdminPermission(false)
  try {
    const target = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    })

    if (!target) {
      throw new Error('کاربر مورد نظر در سیستم یافت نشد.')
    }

    if (caller.role !== 'owner' && target.role === 'ADMIN') {
      throw new Error('تنها مالک اصلی سیستم مجاز به لغو مسدودیت مدیران است.')
    }

    await db.user.update({
      where: { id: userId },
      data: {
        banned: false,
        banReason: null,
        bannedAt: null,
      },
    })
    revalidateUsers()
    return { success: true }
  } catch (err) {
    console.error(`[Actions] Failed to unban user ${userId}:`, err)
    throw err instanceof Error ? err : new Error('Failed to unban user.')
  }
}

/**
 * Delete a user/admin account (Owner only).
 * Rules:
 * - Only OWNER can delete accounts.
 * - Cannot delete an OWNER account.
 */
export async function deleteUser(userId: string) {
  await assertAdminPermission(true)
  try {
    const target = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    })

    if (!target) {
      throw new Error('کاربر مورد نظر در سیستم یافت نشد.')
    }

    if (target.role === 'OWNER') {
      throw new Error('حساب مالک اصلی سیستم قابل حذف نیست.')
    }

    await db.user.delete({
      where: { id: userId },
    })
    revalidateUsers()
    return { success: true }
  } catch (err) {
    console.error(`[Actions] Failed to delete user ${userId}:`, err)
    throw err instanceof Error ? err : new Error('Failed to delete user.')
  }
}

/**
 * Resolve an existing author or create a new one in Payload CMS.
 */
async function resolveOrCreateAuthor(
  payload: any,
  rawData: any,
  appendLog: (msg: string) => void,
): Promise<string | number> {
  const { authorName, authorInput } = parseAuthorNameAndInput(rawData)

  appendLog(`در حال بررسی نویسنده: "${authorName}"...`)

  const authorDocs = await payload.find({
    collection: 'authors',
    where: {
      or: [
        { name: { equals: authorName } },
        { slug: { equals: authorInput.slug } },
      ],
    },
    limit: 1,
  })

  if (authorDocs.docs.length > 0) {
    appendLog(`نویسنده "${authorName}" با شناسه ${authorDocs.docs[0].id} از پیش در سیستم موجود است.`)
    return authorDocs.docs[0].id
  }

  appendLog(`نویسنده یافت نشد؛ در حال ایجاد رکورد نویسنده جدید: "${authorName}"...`)
  const newAuthor = await payload.create({
    collection: 'authors',
    data: authorInput,
  })

  appendLog(`نویسنده جدید با شناسه ${newAuthor.id} ایجاد شد.`)
  return newAuthor.id
}

/**
 * Resolve an existing book or create a new one in Payload CMS.
 */
async function resolveOrCreateBook(
  payload: any,
  rawData: any,
  authorId: string | number,
  appendLog: (msg: string) => void,
): Promise<void> {
  const bookSlug = rawData.slug?.trim() || slugify(rawData.title)
  appendLog(`در حال آماده‌سازی داده‌های کتاب: "${rawData.title}" (شناسه: ${bookSlug})...`)

  const normalizedPages = normalizePages(rawData.pages)
  const normalizedChapters = normalizeChapters(rawData.chapters)
  const bookData = buildBookData(rawData, bookSlug, authorId, normalizedPages, normalizedChapters)

  const bookDocs = await payload.find({
    collection: 'books',
    where: {
      or: [
        { slug: { equals: bookSlug } },
        { title: { equals: rawData.title.trim() } },
      ],
    },
    limit: 1,
  })

  if (bookDocs.docs.length > 0) {
    appendLog(`کتاب با شناسه ${bookDocs.docs[0].id} یافت شد؛ در حال بروزرسانی اطلاعات کتاب...`)
    await payload.update({
      collection: 'books',
      id: bookDocs.docs[0].id,
      data: bookData,
    })
    appendLog(`کتاب با موفقیت بروزرسانی شد.`)
  } else {
    appendLog(`در حال ثبت کتاب جدید در سیستم...`)
    await payload.create({
      collection: 'books',
      data: bookData,
    })
    appendLog(`کتاب جدید با موفقیت ایجاد شد.`)
  }

  revalidateBook(bookSlug)
}

/**
 * Import a book from JSON schema.
 */
export async function importBookAction(jsonString: string): Promise<{ success: boolean; log: string }> {
  await assertAdminPermission(false)
  let log = ''
  const appendLog = (msg: string) => {
    log += `[${new Date().toLocaleTimeString('fa-IR')}] ${msg}\n`
  }

  try {
    const rawData = JSON.parse(jsonString)
    if (!rawData.title) {
      throw new Error('فیلد title اجباری است.')
    }

    const { getPayloadClient } = await import('../../lib/payload')
    const payload = await getPayloadClient()
    appendLog(`آغاز فرآیند درون‌ریزی کتاب: "${rawData.title}"`)

    const authorId = await resolveOrCreateAuthor(payload, rawData, appendLog)
    await resolveOrCreateBook(payload, rawData, authorId, appendLog)

    appendLog(`عملیات درون‌ریزی با موفقیت به پایان رسید.`)
    return { success: true, log }
  } catch (err) {
    appendLog(`خطا در حین درون‌ریزی: ${err instanceof Error ? err.message : String(err)}`)
    console.error('[Actions] Book import failed:', err)
    return { success: false, log }
  }
}
