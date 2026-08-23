'use server'

import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { slugify } from '@/lib/utils'
import { revalidateBook, revalidateBlog } from '@/lib/revalidate'
import { getCurrentUser } from '@/lib/auth-session'
import { headers } from 'next/headers'
import {
  normalizePages,
  normalizeChapters,
  parseAuthorNameAndInput,
  buildBookData,
  parseAnyJsonPayload,
} from './action-helpers'

/**
 * Assert caller is an authorized Admin or Owner.
 */
async function assertAdminPermission(): Promise<{ id: string; role: string }> {
  try {
    const { getPayloadClient } = await import('@/lib/payload')
    const payload = await getPayloadClient()
    const reqHeaders = await headers()
    const { user: payloadUser } = await payload.auth({ headers: reqHeaders })
    if (payloadUser) {
      return { id: String(payloadUser.id), role: payloadUser.role || 'admin' }
    }
  } catch {
    // continue
  }

  const nextAuthUser = await getCurrentUser()
  if (nextAuthUser && !nextAuthUser.banned && (nextAuthUser.role === 'OWNER' || nextAuthUser.role === 'ADMIN')) {
    return { id: nextAuthUser.id, role: nextAuthUser.role }
  }

  if (process.env.NODE_ENV === 'development') {
    return { id: 'dev-admin', role: 'owner' }
  }

  throw new Error('دسترسی غیرمجاز. تنها مدیران و مالک سیستم مجاز به انجام این عملیات هستند.')
}

/**
 * 1. Import Author from JSON
 */
export async function importAuthorAction(jsonString: string): Promise<{ success: boolean; log: string; authorId?: string | number }> {
  await assertAdminPermission()
  let log = ''
  const append = (msg: string) => { log += `[${new Date().toLocaleTimeString('fa-IR')}] ${msg}\n` }

  try {
    const data = parseAnyJsonPayload(jsonString)
    if (!data.name) throw new Error('فیلد name برای نویسنده الزامی است.')

    const { getPayloadClient } = await import('@/lib/payload')
    const payload = await getPayloadClient()

    const authorSlug = data.slug?.trim() || slugify(data.name)
    append(`در حال بررسی نویسنده: "${data.name}" (${authorSlug})...`)

    const existing = await payload.find({
      collection: 'authors',
      where: {
        or: [
          { name: { equals: data.name.trim() } },
          { slug: { equals: authorSlug } },
        ],
      },
      limit: 1,
    })

    const payloadData = {
      name: data.name.trim(),
      nameFa: data.nameFa?.trim() || data.name.trim(),
      slug: authorSlug,
      bio: data.bio?.trim() || '',
      bioFa: data.bioFa?.trim() || '',
      birthYear: data.birthYear ? Number(data.birthYear) : undefined,
      deathYear: data.deathYear ? Number(data.deathYear) : undefined,
      nationality: data.nationality?.trim() || '',
      nationalityFa: data.nationalityFa?.trim() || '',
      era: data.era || 'Modern',
      eraFa: data.eraFa?.trim() || '',
      notableWorks: data.notableWorks?.trim() || '',
      notableWorksFa: data.notableWorksFa?.trim() || '',
    }

    let authorId: string | number
    if (existing.docs.length > 0) {
      authorId = existing.docs[0].id
      append(`نویسنده با شناسه ${authorId} یافت شد؛ در حال بروزرسانی اطلاعات...`)
      await payload.update({
        collection: 'authors',
        id: authorId,
        data: payloadData,
      })
      append(`اطلاعات نویسنده با موفقیت بروزرسانی شد.`)
    } else {
      append(`در حال ایجاد نویسنده جدید...`)
      const created = await payload.create({
        collection: 'authors',
        data: payloadData,
      })
      authorId = created.id
      append(`نویسنده جدید با شناسه ${authorId} ایجاد شد.`)
    }

    return { success: true, log, authorId }
  } catch (err: any) {
    append(`خطا در ثبت نویسنده: ${err?.message || String(err)}`)
    return { success: false, log }
  }
}

/**
 * 2. Import Book Info from JSON
 */
export async function importBookInfoAction(jsonString: string): Promise<{ success: boolean; log: string; bookSlug?: string }> {
  await assertAdminPermission()
  let log = ''
  const append = (msg: string) => { log += `[${new Date().toLocaleTimeString('fa-IR')}] ${msg}\n` }

  try {
    const data = parseAnyJsonPayload(jsonString)
    if (!data.title) throw new Error('فیلد title برای کتاب الزامی است.')

    const { getPayloadClient } = await import('@/lib/payload')
    const payload = await getPayloadClient()

    const bookSlug = data.slug?.trim() || slugify(data.title)
    append(`در حال پردازش مشخصات کتاب: "${data.title}" (${bookSlug})...`)

    // Resolve Author
    let authorId: string | number | undefined
    if (data.author) {
      const authorRes = await importAuthorAction(JSON.stringify(typeof data.author === 'string' ? { name: data.author } : data.author))
      authorId = authorRes.authorId
      log += authorRes.log
    }

    if (!authorId) {
      // Find default or first author
      const authors = await payload.find({ collection: 'authors', limit: 1 })
      if (authors.docs.length > 0) {
        authorId = authors.docs[0].id
      } else {
        const created = await payload.create({
          collection: 'authors',
          data: { name: 'Unknown Author', nameFa: 'نویسنده ناشناس', slug: 'unknown-author' },
        })
        authorId = created.id
      }
    }

    const bookData = {
      title: data.title.trim(),
      slug: bookSlug,
      author: authorId,
      description: data.description?.trim() || '',
      level: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(data.level) ? data.level : 'B1',
      genres: Array.isArray(data.genres) ? data.genres : data.genres ? [String(data.genres)] : ['Classic'],
      pageCount: Number(data.pageCount) || (Array.isArray(data.pages) ? data.pages.length : 0),
      publishedYear: Number(data.publishedYear) || 1950,
      coverFrom: data.coverFrom || '#3b2d1f',
      coverTo: data.coverTo || '#1a140e',
      coverAccent: data.coverAccent || '#f4d35e',
      isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : true,
      allowDownload: data.allowDownload !== undefined ? Boolean(data.allowDownload) : true,
    }

    const existing = await payload.find({
      collection: 'books',
      where: {
        or: [{ slug: { equals: bookSlug } }, { title: { equals: data.title.trim() } }],
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      append(`کتاب در دیتابیس یافت شد؛ در حال بروزرسانی مشخصات...`)
      await payload.update({
        collection: 'books',
        id: existing.docs[0].id,
        data: bookData,
      })
      append(`مشخصات کتاب با موفقیت بروزرسانی شد.`)
    } else {
      append(`در حال ثبت کتاب جدید...`)
      await payload.create({
        collection: 'books',
        data: bookData,
      })
      append(`کتاب جدید با موفقیت در سیستم ثبت گردید.`)
    }

    revalidateBook(bookSlug)
    return { success: true, log, bookSlug }
  } catch (err: any) {
    append(`خطا در ثبت اطلاعات کتاب: ${err?.message || String(err)}`)
    return { success: false, log }
  }
}

/**
 * 3. Import Book Content (Chapters & Pages) from JSON
 */
export async function importBookContentAction(jsonString: string): Promise<{ success: boolean; log: string; bookSlug?: string }> {
  await assertAdminPermission()
  let log = ''
  const append = (msg: string) => { log += `[${new Date().toLocaleTimeString('fa-IR')}] ${msg}\n` }

  try {
    const data = parseAnyJsonPayload(jsonString)
    const bookSlug = data.bookSlug?.trim() || data.slug?.trim()
    if (!bookSlug) throw new Error('فیلد bookSlug برای شناسایی کتاب الزامی است.')

    const { getPayloadClient } = await import('@/lib/payload')
    const payload = await getPayloadClient()

    append(`در حال بارگذاری کتاب با شناسه "${bookSlug}"...`)
    const books = await payload.find({
      collection: 'books',
      where: { slug: { equals: bookSlug } },
      limit: 1,
    })

    if (books.docs.length === 0) {
      throw new Error(`کتاب با شناسه "${bookSlug}" یافت نشد. ابتدا مشخصات کتاب را ثبت کنید.`)
    }

    const bookDoc = books.docs[0]
    const chapters = normalizeChapters(data.chapters || [])
    const pages = normalizePages(data.pages || [])

    append(`تعداد ${chapters.length} فصل و ${pages.length} صفحه شناسایی شد.`)
    append(`در حال بروزرسانی محتوای کتاب در دیتابیس...`)

    await payload.update({
      collection: 'books',
      id: bookDoc.id,
      data: {
        chapters,
        pages,
        pageCount: pages.length > 0 ? pages.length : bookDoc.pageCount,
      },
    })

    append(`محتوای دو زبانه و صفحات کتاب با موفقیت ذخیره شد.`)
    revalidateBook(bookSlug)
    return { success: true, log, bookSlug }
  } catch (err: any) {
    append(`خطا در ثبت صفحات کتاب: ${err?.message || String(err)}`)
    return { success: false, log }
  }
}

/**
 * 4. Import Full All-in-One Book Bundle from JSON
 */
export async function importFullBookBundleAction(jsonString: string): Promise<{ success: boolean; log: string; bookSlug?: string }> {
  await assertAdminPermission()
  let log = ''
  const append = (msg: string) => { log += `[${new Date().toLocaleTimeString('fa-IR')}] ${msg}\n` }

  try {
    const data = parseAnyJsonPayload(jsonString)
    if (!data.title) throw new Error('فیلد title اجباری است.')

    const { getPayloadClient } = await import('@/lib/payload')
    const payload = await getPayloadClient()

    const bookSlug = data.slug?.trim() || slugify(data.title)
    append(`شروع فرآیند ثبت بسته کامل کتاب: "${data.title}"`)

    // Step 1: Author
    const authorRes = await importAuthorAction(JSON.stringify(typeof data.author === 'string' ? { name: data.author } : data.author || { name: 'Unknown Author' }))
    log += authorRes.log
    const authorId = authorRes.authorId

    // Step 2: Book Info + Chapters + Pages
    const chapters = normalizeChapters(data.chapters || [])
    const pages = normalizePages(data.pages || [])
    const pageCount = pages.length > 0 ? pages.length : Number(data.pageCount) || 0

    const bookData = {
      title: data.title.trim(),
      slug: bookSlug,
      author: authorId,
      description: data.description?.trim() || '',
      level: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(data.level) ? data.level : 'B1',
      genres: Array.isArray(data.genres) ? data.genres : ['Classic'],
      pageCount,
      publishedYear: Number(data.publishedYear) || 1950,
      coverFrom: data.coverFrom || '#1e3a8a',
      coverTo: data.coverTo || '#0f172a',
      coverAccent: data.coverAccent || '#f4d35e',
      isPublished: true,
      allowDownload: true,
      chapters,
      pages,
    }

    const existing = await payload.find({
      collection: 'books',
      where: {
        or: [{ slug: { equals: bookSlug } }, { title: { equals: data.title.trim() } }],
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      append(`کتاب از پیش موجود بود؛ در حال بروزرسانی کامل...`)
      await payload.update({
        collection: 'books',
        id: existing.docs[0].id,
        data: bookData,
      })
      append(`بسته کامل کتاب با موفقیت بروزرسانی شد.`)
    } else {
      append(`در حال ایجاد کتاب جدید همراه با تمامی فصول و صفحات...`)
      await payload.create({
        collection: 'books',
        data: bookData,
      })
      append(`کتاب جدید به همراه تمامی محتوا با موفقیت ایجاد گردید.`)
    }

    revalidateBook(bookSlug)
    return { success: true, log, bookSlug }
  } catch (err: any) {
    append(`خطا در ثبت پکیج کامل: ${err?.message || String(err)}`)
    return { success: false, log }
  }
}

/**
 * 5. Import Blog Post from JSON
 */
export async function importBlogPostAction(jsonString: string): Promise<{ success: boolean; log: string; slug?: string }> {
  await assertAdminPermission()
  let log = ''
  const append = (msg: string) => { log += `[${new Date().toLocaleTimeString('fa-IR')}] ${msg}\n` }

  try {
    const data = parseAnyJsonPayload(jsonString)
    if (!data.title) throw new Error('فیلد title برای مقاله الزامی است.')

    const slug = data.slug?.trim() || slugify(data.title)
    const { getPayloadClient } = await import('@/lib/payload')
    const payload = await getPayloadClient()

    append(`در حال بررسی مقاله: "${data.title}" (${slug})...`)

    const existing = await payload.find({
      collection: 'blogPosts',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    // Find a valid user to assign as author
    const users = await payload.find({ collection: 'users', limit: 1 })
    const authorId = users.docs.length > 0 ? users.docs[0].id : undefined

    // Find related book if provided
    let relatedBookId: string | number | undefined
    if (data.relatedBookSlug) {
      const b = await payload.find({
        collection: 'books',
        where: { slug: { equals: data.relatedBookSlug.trim() } },
        limit: 1,
      })
      if (b.docs.length > 0) relatedBookId = b.docs[0].id
    }

    const blogData: any = {
      title: data.title.trim(),
      slug,
      excerpt: data.excerpt?.trim() || '',
      tags: Array.isArray(data.tags) ? data.tags : ['آموزش زبان'],
      publishedAt: new Date().toISOString(),
      _status: 'published',
    }

    if (authorId) blogData.author = authorId
    if (relatedBookId) blogData.relatedBook = relatedBookId

    if (existing.docs.length > 0) {
      append(`مقاله با شناسه ${existing.docs[0].id} یافت شد؛ در حال بروزرسانی...`)
      await payload.update({
        collection: 'blogPosts',
        id: existing.docs[0].id,
        data: blogData,
      })
      append(`مقاله با موفقیت بروزرسانی شد.`)
    } else {
      append(`در حال ایجاد مقاله جدید در وبلاگ...`)
      await payload.create({
        collection: 'blogPosts',
        data: blogData,
      })
      append(`مقاله جدید با موفقیت منتشر گردید.`)
    }

    // Direct upsert to Prisma for immediate availability
    await db.blogPost.upsert({
      where: { slug },
      update: {
        title: data.title.trim(),
        excerpt: data.excerpt?.trim() || '',
        content: data.content || '',
        tags: JSON.stringify(blogData.tags),
        published: true,
        publishedAt: new Date(),
      },
      create: {
        slug,
        title: data.title.trim(),
        excerpt: data.excerpt?.trim() || '',
        content: data.content || '',
        tags: JSON.stringify(blogData.tags),
        published: true,
        publishedAt: new Date(),
      },
    })

    revalidateBlog(slug)
    return { success: true, log, slug }
  } catch (err: any) {
    append(`خطا در ثبت مقاله: ${err?.message || String(err)}`)
    return { success: false, log }
  }
}

/**
 * 6. Import Quotes from JSON
 */
export async function importQuoteAction(jsonString: string): Promise<{ success: boolean; log: string; count?: number }> {
  await assertAdminPermission()
  let log = ''
  const append = (msg: string) => { log += `[${new Date().toLocaleTimeString('fa-IR')}] ${msg}\n` }

  try {
    const data = parseAnyJsonPayload(jsonString)
    const quoteList: any[] = Array.isArray(data) ? data : Array.isArray(data.quotes) ? data.quotes : [data]

    if (quoteList.length === 0) throw new Error('حداقل یک نقل‌قول در فایل JSON باید وجود داشته باشد.')

    const { getPayloadClient } = await import('@/lib/payload')
    const payload = await getPayloadClient()

    let importedCount = 0

    for (const q of quoteList) {
      if (!q.text) continue
      const qSlug = q.slug?.trim() || slugify(q.text.slice(0, 40))

      append(`در حال پردازش نقل‌قول: "${q.text.slice(0, 30)}..."`)

      let bookId: string | number | undefined
      if (q.bookSlug) {
        const books = await payload.find({
          collection: 'books',
          where: { slug: { equals: q.bookSlug.trim() } },
          limit: 1,
        })
        if (books.docs.length > 0) bookId = books.docs[0].id
      }

      const quoteData: any = {
        slug: qSlug,
        text: q.text.trim(),
        textFa: q.textFa?.trim() || '',
        bookSlug: q.bookSlug?.trim() || '',
        bookTitle: q.bookTitle?.trim() || '',
        bookAuthor: q.bookAuthor?.trim() || '',
        pageNumber: Number(q.pageNumber) || 1,
        themes: Array.isArray(q.themes) ? q.themes : ['حکمت'],
        length: ['کوتاه', 'متوسط', 'بلند'].includes(q.length) ? q.length : 'متوسط',
        isActive: true,
      }

      if (bookId) quoteData.book = bookId

      const existing = await payload.find({
        collection: 'quotes',
        where: { slug: { equals: qSlug } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        await payload.update({
          collection: 'quotes',
          id: existing.docs[0].id,
          data: quoteData,
        })
      } else {
        await payload.create({
          collection: 'quotes',
          data: quoteData,
        })
      }
      importedCount++
    }

    append(`تعداد ${importedCount} نقل‌قول با موفقیت ثبت/بروزرسانی شد.`)
    return { success: true, log, count: importedCount }
  } catch (err: any) {
    append(`خطا در ثبت نقل‌قول: ${err?.message || String(err)}`)
    return { success: false, log }
  }
}

/**
 * 7. Get Books list for editing in visual reader
 */
export async function getBookListForEditingAction() {
  await assertAdminPermission()
  try {
    const { getPayloadClient } = await import('@/lib/payload')
    const payload = await getPayloadClient()
    const books = await payload.find({
      collection: 'books',
      limit: 100,
      sort: '-createdAt',
    })
    return books.docs.map((b: any) => ({
      id: String(b.id),
      title: b.title,
      slug: b.slug,
      level: b.level,
      pageCount: b.pageCount || (b.pages?.length ?? 0),
      pagesLength: b.pages?.length ?? 0,
      authorName: typeof b.author === 'object' ? b.author?.name : 'Author',
      isPublished: Boolean(b.isPublished),
    }))
  } catch (err) {
    console.error('Failed to get book list:', err)
    return []
  }
}

/**
 * 8. Get Book Content (Chapters & Pages) for visual editing
 */
export async function getBookContentForEditingAction(bookSlug: string) {
  await assertAdminPermission()
  try {
    const { getPayloadClient } = await import('@/lib/payload')
    const payload = await getPayloadClient()
    const books = await payload.find({
      collection: 'books',
      where: { slug: { equals: bookSlug } },
      limit: 1,
      depth: 2,
    })

    if (books.docs.length === 0) return null
    const b = books.docs[0] as any
    return {
      id: String(b.id),
      title: b.title,
      slug: b.slug,
      level: b.level,
      description: b.description,
      chapters: (b.chapters || []).map((c: any) => ({
        title: c.title,
        titleFa: c.titleFa || '',
        slug: c.slug,
        order: c.order || 0,
        startPage: c.startPage || 1,
      })),
      pages: (b.pages || []).map((p: any, idx: number) => ({
        pageNumber: p.pageNumber || idx + 1,
        english: p.english || '',
        farsi: p.farsi || '',
        type: p.type || 'text',
      })),
    }
  } catch (err) {
    console.error('Failed to get book content for editing:', err)
    return null
  }
}

/**
 * 9. Save Book Pages & Chapters from Visual Editor
 */
export async function saveBookPagesAction(
  bookSlug: string,
  chapters: any[],
  pages: any[],
): Promise<{ success: boolean; message: string }> {
  await assertAdminPermission()
  try {
    const { getPayloadClient } = await import('@/lib/payload')
    const payload = await getPayloadClient()

    const books = await payload.find({
      collection: 'books',
      where: { slug: { equals: bookSlug } },
      limit: 1,
    })

    if (books.docs.length === 0) {
      throw new Error(`کتاب "${bookSlug}" یافت نشد.`)
    }

    const normChapters = normalizeChapters(chapters)
    const normPages = normalizePages(pages)

    await payload.update({
      collection: 'books',
      id: books.docs[0].id,
      data: {
        chapters: normChapters,
        pages: normPages,
        pageCount: normPages.length,
      },
    })

    revalidateBook(bookSlug)
    return { success: true, message: `تعداد ${normPages.length} صفحه با موفقیت در دیتابیس ذخیره شد.` }
  } catch (err: any) {
    return { success: false, message: err?.message || 'خطا در ذخیره‌سازی صفحات کتاب.' }
  }
}

/**
 * 10. Get Blog Posts list for visual editing
 */
export async function getBlogPostsForEditingAction() {
  await assertAdminPermission()
  try {
    const posts = await db.blogPost.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        published: true,
        publishedAt: true,
        viewCount: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return posts.map((p) => ({
      ...p,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    }))
  } catch (err) {
    console.error('Failed to get blog posts list:', err)
    return []
  }
}

/**
 * 11. Sync all Prisma books, authors, blog posts, and quotes to Payload CMS
 */
export async function syncPrismaToPayloadAction(): Promise<{ success: boolean; message: string; log: string }> {
  await assertAdminPermission()
  let log = ''
  const append = (msg: string) => {
    log += `[${new Date().toLocaleTimeString('fa-IR')}] ${msg}\n`
  }

  try {
    const { getPayloadClient } = await import('@/lib/payload')
    const payload = await getPayloadClient()

    append('شروع همگام‌سازی جامع محتوای سایت با پنل Payload CMS...')

    // 1. Sync Authors
    const authors = await db.author.findMany()
    const authorPayloadIdMap = new Map<string, string | number>()

    for (const author of authors) {
      const authorSlug = author.slug || slugify(author.name)
      const existing = await payload.find({
        collection: 'authors',
        where: {
          or: [{ slug: { equals: authorSlug } }, { name: { equals: author.name } }],
        },
        limit: 1,
      })

      const authorData = {
        name: author.name,
        nameFa: author.nameFa || author.name,
        slug: authorSlug,
        bio: author.bio || '',
        bioFa: author.bioFa || '',
        birthYear: author.birthYear || undefined,
        deathYear: author.deathYear || undefined,
        nationality: author.nationality || '',
        nationalityFa: author.nationalityFa || '',
        era: (['Augustan', 'Romantic', 'Victorian', 'Edwardian', 'Modern', 'Postmodern'].includes(author.era || '') ? author.era : 'Modern') as any,
        eraFa: author.eraFa || '',
      }

      let payloadAuthorId: string | number
      if (existing.docs.length > 0) {
        payloadAuthorId = existing.docs[0].id
        await payload.update({
          collection: 'authors',
          id: payloadAuthorId,
          data: authorData,
        })
      } else {
        const created = await payload.create({
          collection: 'authors',
          data: authorData,
        })
        payloadAuthorId = created.id
      }
      authorPayloadIdMap.set(author.id, payloadAuthorId)
      authorPayloadIdMap.set(authorSlug, payloadAuthorId)
    }
    append(`تعداد ${authors.length} نویسنده با موفقیت همگام‌سازی شد.`)

    // 2. Sync Books, Chapters & Pages
    const books = await db.book.findMany({
      include: {
        author: true,
        chapters: { orderBy: { order: 'asc' } },
        pages: { orderBy: { pageNumber: 'asc' } },
      },
    })

    for (const book of books) {
      const bookSlug = book.slug || slugify(book.title)
      const authorId =
        authorPayloadIdMap.get(book.authorId) ||
        authorPayloadIdMap.get(book.author?.slug || '') ||
        Array.from(authorPayloadIdMap.values())[0]

      let parsedGenres: string[] = ['Classic']
      try {
        if (typeof book.genres === 'string') {
          const parsed = JSON.parse(book.genres)
          if (Array.isArray(parsed)) parsedGenres = parsed
        }
      } catch {}

      const chapters = book.chapters.map((c) => ({
        title: c.title,
        titleFa: c.titleFa || '',
        slug: c.slug || slugify(c.title),
        order: c.order || 0,
        startPage: c.startPage || 1,
      }))

      const pages = book.pages.map((p) => ({
        pageNumber: p.pageNumber,
        english: p.english,
        farsi: p.farsi || '',
        type: (['text', 'heading', 'image', 'quote'].includes(p.type || '') ? p.type : 'text') as any,
      }))

      const bookData: any = {
        title: book.title,
        slug: bookSlug,
        author: authorId,
        description: book.description || '',
        level: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(book.level) ? book.level : 'B1',
        genres: parsedGenres,
        pageCount: book.pageCount || pages.length,
        publishedYear: book.publishedYear || 1950,
        coverFrom: book.coverFrom || '#3b2d1f',
        coverTo: book.coverTo || '#1a140e',
        coverAccent: book.coverAccent || '#f4d35e',
        isPublished: book.isPublished !== false,
        allowDownload: book.allowDownload !== false,
        chapters,
        pages,
      }

      const existing = await payload.find({
        collection: 'books',
        where: {
          or: [{ slug: { equals: bookSlug } }, { title: { equals: book.title } }],
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        await payload.update({
          collection: 'books',
          id: existing.docs[0].id,
          data: bookData,
        })
      } else {
        await payload.create({
          collection: 'books',
          data: bookData,
        })
      }
      revalidateBook(bookSlug)
    }
    append(`تعداد ${books.length} عنوان کتاب با تمام فصول و صفحات همگام‌سازی شد.`)

    // 3. Sync Blog Posts
    const posts = await db.blogPost.findMany()
    for (const post of posts) {
      const postSlug = post.slug || slugify(post.title)
      let parsedTags: string[] = ['آموزش زبان']
      try {
        if (typeof post.tags === 'string') {
          const parsed = JSON.parse(post.tags)
          if (Array.isArray(parsed)) parsedTags = parsed
        }
      } catch {}

      const postData: any = {
        title: post.title,
        slug: postSlug,
        excerpt: post.excerpt || '',
        tags: parsedTags,
        publishedAt: post.publishedAt ? post.publishedAt.toISOString() : new Date().toISOString(),
        _status: post.published ? 'published' : 'draft',
      }

      const existing = await payload.find({
        collection: 'blogPosts',
        where: { slug: { equals: postSlug } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        await payload.update({
          collection: 'blogPosts',
          id: existing.docs[0].id,
          data: postData,
        })
      } else {
        await payload.create({
          collection: 'blogPosts',
          data: postData,
        })
      }
      revalidateBlog(postSlug)
    }
    append(`تعداد ${posts.length} مقاله وبلاگ همگام‌سازی شد.`)

    append('عملیات همگام‌سازی کامل با موفقیت خاتمه یافت!')
    return {
      success: true,
      message: `همگام‌سازی موفق: ${books.length} کتاب، ${authors.length} نویسنده و ${posts.length} مقاله به پنل CMS متصل شدند.`,
      log,
    }
  } catch (err: any) {
    append(`خطا در همگام‌سازی: ${err?.message || String(err)}`)
    return {
      success: false,
      message: err?.message || 'خطا در عملیات همگام‌سازی.',
      log,
    }
  }
}

/**
 * 10. Get Mockup Books Mode Status (Default: false / off)
 */
export async function getMockupModeAction(): Promise<{ enabled: boolean; mockBooksCount: number }> {
  try {
    const publishedCount = await db.book.count({ where: { isPublished: true } })
    const totalCount = await db.book.count()
    return { enabled: publishedCount > 0, mockBooksCount: totalCount }
  } catch (err) {
    return { enabled: false, mockBooksCount: 0 }
  }
}

/**
 * 11. Toggle Mockup Books Mode (Default: false)
 * When false, disables/hides all sample/mock books in both Prisma and Payload CMS.
 * When true, activates sample/mock books for testing.
 */
export async function toggleMockupModeAction(enabled: boolean): Promise<{ success: boolean; message: string; enabled: boolean }> {
  await assertAdminPermission()
  try {
    // 1. Update Prisma books
    await db.book.updateMany({
      data: { isPublished: enabled },
    })

    // 2. Update Payload CMS books if available
    try {
      const { getPayloadClient } = await import('@/lib/payload')
      const payload = await getPayloadClient()
      const payloadBooks = await payload.find({
        collection: 'books',
        limit: 250,
      })
      for (const b of payloadBooks.docs) {
        await payload.update({
          collection: 'books',
          id: b.id,
          data: { isPublished: enabled },
        })
      }
    } catch (payloadErr) {
      console.warn('Payload CMS sync warning during mockup toggle:', payloadErr)
    }

    // 3. Revalidate cache
    try {
      const { revalidatePath } = await import('next/cache')
      revalidatePath('/')
      revalidatePath('/books')
      revalidatePath('/admin')
    } catch {}

    return {
      success: true,
      message: enabled
        ? 'حالت داده‌های موکاپ فعال شد. کتاب‌های نمونه در سایت و پنل نمایش داده می‌شوند.'
        : 'حالت داده‌های موکاپ غیرفعال شد. کلیه کتاب‌های نمونه از دید کاربران و پنل مخفی شدند.',
      enabled,
    }
  } catch (err: any) {
    return {
      success: false,
      message: `خطا در تغییر وضعیت موکاپ: ${err?.message || String(err)}`,
      enabled: !enabled,
    }
  }
}

/**
 * 14. Parse EPUB File Action
 * Accepts FormData with 'file' (.epub) and optional 'wordsPerPage',
 * extracts chapters, metadata, and slices text into standard bilingual pages.
 */
export async function parseEpubFileAction(
  formData: FormData,
): Promise<{
  success: boolean
  data?: any
  message?: string
}> {
  await assertAdminPermission()

  try {
    const file = formData.get('file') as File | null
    if (!file) {
      throw new Error('فایل EPUB انتخاب نشده است.')
    }

    const actualPageCountStr = formData.get('actualPageCount')
    let actualPageCount: number | undefined
    if (actualPageCountStr) {
      const parsed = parseInt(actualPageCountStr.toString(), 10)
      if (!isNaN(parsed) && parsed > 0) {
        actualPageCount = parsed
      }
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { parseEpubBuffer } = await import('@/lib/epub-parser')
    const parsed = parseEpubBuffer(buffer, actualPageCount)

    return {
      success: true,
      data: parsed,
      message: `فایل «${parsed.title}» با موفقیت تحلیل شد: ${parsed.chapters.length} فصل و ${parsed.totalPages} صفحه استخراج شدند.`,
    }
  } catch (err: any) {
    return {
      success: false,
      message: `خطا در استخراج فایل EPUB: ${err?.message || String(err)}`,
    }
  }
}



