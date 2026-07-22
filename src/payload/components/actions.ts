'use server'

import { db } from '../../lib/db'
import { getPayloadClient } from '../../lib/payload'
import { slugify } from '../../lib/utils'

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
  try {
    const totalUsers = await db.user.count()
    const activeUsers = await db.user.count({
      where: { onboardingCompleted: true },
    })
    const totalReadingSessions = await db.readingSession.count()

    const readingSessionsAgg = await db.readingSession.aggregate({
      _sum: {
        pagesRead: true,
        minutesRead: true,
      },
    })
    const totalPagesRead = readingSessionsAgg._sum.pagesRead || 0
    const totalMinutesRead = readingSessionsAgg._sum.minutesRead || 0

    const totalDownloads = await db.bookDownload.count()
    const openTickets = await db.supportTicket.count({
      where: { status: 'OPEN' },
    })

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
  stats: {
    reviewsCount: number
    progressCount: number
    downloadsCount: number
    sessionsCount: number
  }
}

/**
 * Search website users in the Prisma database.
 */
export async function searchUsers(query: string): Promise<ManagedUser[]> {
  try {
    const q = query.trim()
    const where: any = {}
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
        _count: {
          select: {
            reviews: true,
            readingProgress: true,
            bookDownloads: true,
            readingSessions: true,
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
      stats: {
        reviewsCount: u._count.reviews,
        progressCount: u._count.readingProgress,
        downloadsCount: u._count.bookDownloads,
        sessionsCount: u._count.readingSessions,
      },
    }))
  } catch (err) {
    console.error('[Actions] Failed to search users:', err)
    throw new Error('Failed to retrieve user list.')
  }
}

/**
 * Promote or change a user's role.
 */
export async function updateUserRole(userId: string, role: string) {
  try {
    if (!['USER', 'ADMIN', 'OWNER'].includes(role)) {
      throw new Error('Invalid role specified.')
    }
    await db.user.update({
      where: { id: userId },
      data: { role },
    })
    return { success: true }
  } catch (err) {
    console.error(`[Actions] Failed to update user role for ${userId}:`, err)
    throw new Error('Failed to update user role.')
  }
}

/**
 * Ban a website user.
 */
export async function banUser(userId: string, reason: string) {
  try {
    const cleanReason = reason.trim() || 'نقض قوانین وب‌سایت'
    await db.user.update({
      where: { id: userId },
      data: {
        banned: true,
        banReason: cleanReason,
        bannedAt: new Date(),
      },
    })
    return { success: true }
  } catch (err) {
    console.error(`[Actions] Failed to ban user ${userId}:`, err)
    throw new Error('Failed to ban user.')
  }
}

/**
 * Unban a website user.
 */
export async function unbanUser(userId: string) {
  try {
    await db.user.update({
      where: { id: userId },
      data: {
        banned: false,
        banReason: null,
        bannedAt: null,
      },
    })
    return { success: true }
  } catch (err) {
    console.error(`[Actions] Failed to unban user ${userId}:`, err)
    throw new Error('Failed to unban user.')
  }
}

/**
 * Import a book from JSON schema.
 */
export async function importBookAction(jsonString: string): Promise<{ success: boolean; log: string }> {
  let log = ''
  const appendLog = (msg: string) => {
    log += `[${new Date().toLocaleTimeString('fa-IR')}] ${msg}\n`
  }

  try {
    const rawData = JSON.parse(jsonString)
    if (!rawData.title) {
      throw new Error('فیلد title اجباری است.')
    }

    const payload = await getPayloadClient()
    appendLog(`آغاز فرآیند درون‌ریزی کتاب: "${rawData.title}"`)

    // 1. Resolve author
    let authorName = ''
    let authorInput: any = null
    if (typeof rawData.author === 'string') {
      authorName = rawData.author.trim()
    } else if (rawData.author && typeof rawData.author === 'object') {
      authorInput = rawData.author
      authorName = rawData.author.name
    }

    if (!authorName) {
      throw new Error('نام نویسنده (author) نامعتبر یا خالی است.')
    }

    appendLog(`بررسی نویسنده: "${authorName}"`)
    const authorDocs = await payload.find({
      collection: 'authors',
      where: {
        name: { equals: authorName },
      },
      limit: 1,
    })

    let authorId: string | number
    if (authorDocs.docs.length > 0) {
      authorId = authorDocs.docs[0].id
      appendLog(`نویسنده از قبل وجود دارد (ID: ${authorId})`)
    } else {
      appendLog(`ایجاد نویسنده جدید در سیستم...`)
      const authorSlug = slugify(authorName) || `author-${Date.now()}`
      const newAuthor = await payload.create({
        collection: 'authors',
        data: {
          slug: authorSlug,
          name: authorName,
          nameFa: authorInput?.nameFa || '',
          bio: authorInput?.bio || '',
          bioFa: authorInput?.bioFa || '',
          birthYear: authorInput?.birthYear ? Number(authorInput.birthYear) : undefined,
          deathYear: authorInput?.deathYear ? Number(authorInput.deathYear) : undefined,
          nationality: authorInput?.nationality || '',
          nationalityFa: authorInput?.nationalityFa || '',
          flagEmoji: authorInput?.flagEmoji || '',
          era: authorInput?.era || 'Modern',
          eraFa: authorInput?.eraFa || '',
          notableWorks: Array.isArray(authorInput?.notableWorks) ? authorInput.notableWorks : [],
          featured: !!authorInput?.featured,
        },
      })
      authorId = newAuthor.id
      appendLog(`نویسنده جدید با موفقیت ایجاد شد (ID: ${authorId})`)
    }

    // 2. Resolve cover image if any coverImageUrl is supplied
    // For now, we reuse the hex gradient fields. If you want, you can upload to Media,
    // but usually in typical import JSON we can fallback to gradients.
    appendLog(`پردازش کتاب...`)
    const bookSlug = rawData.slug?.trim() ? slugify(rawData.slug) : slugify(rawData.title)
    if (!bookSlug) {
      throw new Error('تولید اسلاگ کتاب با خطا مواجه شد.')
    }

    const bookDocs = await payload.find({
      collection: 'books',
      where: {
        slug: { equals: bookSlug },
      },
      limit: 1,
    })

    const rawPages = Array.isArray(rawData.pages) ? rawData.pages : []
    const normalizedPages = rawPages.map((p: any, idx: number) => ({
      pageNumber: p.pageNumber || idx + 1,
      english: p.english || '',
      farsi: p.farsi || '',
      type: p.type || 'text',
      meta: typeof p.meta === 'string' ? p.meta : JSON.stringify(p.meta || {}),
    }))

    // Deduplicate and sort pages
    normalizedPages.sort((a: any, b: any) => a.pageNumber - b.pageNumber)

    const rawChapters = Array.isArray(rawData.chapters) ? rawData.chapters : []
    const normalizedChapters = rawChapters.map((c: any, idx: number) => ({
      title: c.title || `Chapter ${idx + 1}`,
      titleFa: c.titleFa || '',
      slug: c.slug || slugify(c.title || `chapter-${idx + 1}`),
      order: c.order !== undefined ? Number(c.order) : idx + 1,
      startPage: c.startPage !== undefined ? Number(c.startPage) : 1,
    }))

    const bookData = {
      title: rawData.title,
      slug: bookSlug,
      author: authorId,
      description: rawData.description || '',
      level: rawData.level || 'B1',
      genres: Array.isArray(rawData.genres) ? rawData.genres : [],
      pageCount: normalizedPages.length,
      publishedYear: rawData.publishedYear ? Number(rawData.publishedYear) : 1900,
      coverFrom: rawData.coverFrom || '#b8956a',
      coverTo: rawData.coverTo || '#6d523a',
      coverAccent: rawData.coverAccent || '#f4d35e',
      isPublished: rawData.isPublished !== false,
      isPremium: !!rawData.isPremium,
      allowDownload: rawData.allowDownload !== false,
      rating: rawData.rating ? Number(rawData.rating) : 0,
      reviewCount: rawData.reviewCount ? Number(rawData.reviewCount) : 0,
      viewCount: rawData.viewCount ? Number(rawData.viewCount) : 0,
      chapters: normalizedChapters,
      pages: normalizedPages,
    }

    if (bookDocs.docs.length > 0) {
      appendLog(`کتاب از قبل با اسلاگ "${bookSlug}" وجود دارد. در حال بروزرسانی کتاب...`)
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

    appendLog(`عملیات درون‌ریزی با موفقیت به پایان رسید.`)
    return { success: true, log }
  } catch (err) {
    appendLog(`خطا در حین درون‌ریزی: ${err instanceof Error ? err.message : String(err)}`)
    console.error('[Actions] Book import failed:', err)
    return { success: false, log }
  }
}
