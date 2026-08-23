import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { db } from '@/lib/db'
import { slugify } from '@/lib/utils'

export async function GET() {
  try {
    const payload = await getPayloadClient()
    const logs: string[] = []

    // 1. Authors
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
    logs.push(`Synced ${authors.length} authors.`)

    // 2. Books, Chapters, Pages
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
    }
    logs.push(`Synced ${books.length} books with all chapters and pages.`)

    // 3. Blog Posts
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
    }
    logs.push(`Synced ${posts.length} blog posts.`)

    // 4. Quotes
    let quotes = await db.quote.findMany()
    if (quotes.length === 0) {
      const DEFAULT_CURATED_QUOTES = [
        {
          slug: 'pride-prejudice-truth',
          text: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
          textFa: 'این حقیقتی است پذیرفته‌شده در سراسر جهان که مردی مجرد با ثروتی هنگفت، بی‌تردید نیازمند همسری است.',
          bookSlug: 'pride-and-prejudice',
          bookTitle: 'Pride and Prejudice',
          bookAuthor: 'Jane Austen',
          pageNumber: 1,
          themes: JSON.stringify(['حکمت', 'عشق', 'رشد شخصی']),
          length: 'متوسط',
          isActive: true,
        },
        {
          slug: 'alice-curiouser',
          text: 'Curiouser and curiouser! cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English).',
          textFa: 'عجیب‌تر و عجیب‌تر! آلیس فریاد زد (چنان شگفت‌زده شده بود که برای لحظه‌ای نحوه صحبت کردن درست به زبان انگلیسی را فراموش کرد).',
          bookSlug: 'alice-in-wonderland',
          bookTitle: "Alice's Adventures in Wonderland",
          bookAuthor: 'Lewis Carroll',
          pageNumber: 2,
          themes: JSON.stringify(['خیال', 'ماجراجویی']),
          length: 'متوسط',
          isActive: true,
        },
        {
          slug: 'tale-of-two-cities-best-times',
          text: 'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness.',
          textFa: 'بهترین دوران‌ها بود و بدترین دوران‌ها؛ عصر حکمت بود و عصر بی‌خردی؛ دورانی سرشار از ایمان و دورانی آکنده از ناباوری.',
          bookSlug: 'a-tale-of-two-cities',
          bookTitle: 'A Tale of Two Cities',
          bookAuthor: 'Charles Dickens',
          pageNumber: 1,
          themes: JSON.stringify(['زمان', 'حکمت', 'امید']),
          length: 'متوسط',
          isActive: true,
        },
        {
          slug: 'dorian-gray-live',
          text: 'To live is the rarest thing in the world. Most people exist, that is all.',
          textFa: 'زندگی کردن نایاب‌ترین اتفاق جهان است؛ بیشتر مردم تنها وجود دارند، همین و بس.',
          bookSlug: 'the-picture-of-dorian-gray',
          bookTitle: 'The Picture of Dorian Gray',
          bookAuthor: 'Oscar Wilde',
          pageNumber: 3,
          themes: JSON.stringify(['حکمت', 'رشد شخصی']),
          length: 'کوتاه',
          isActive: true,
        },
        {
          slug: 'moby-dick-ishmael',
          text: 'Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, I thought I would sail about a little.',
          textFa: 'مرا اسماعیل صدا بزنید. چند سال پیش، وقتی پولی در بساط نداشتم، بر آن شدم که کمی به دریا بزنم و بخش آب‌های جهان را تماشا کنم.',
          bookSlug: 'moby-dick',
          bookTitle: 'Moby Dick',
          bookAuthor: 'Herman Melville',
          pageNumber: 1,
          themes: JSON.stringify(['ماجراجویی', 'طبیعت']),
          length: 'متوسط',
          isActive: true,
        },
        {
          slug: 'little-prince-heart',
          text: 'It is only with the heart that one can see rightly; what is essential is invisible to the eye.',
          textFa: 'تنها با چشم دل است که می‌توان درست دید؛ آنچه اصل است و بنیادین، از دیده پنهان است.',
          bookSlug: 'the-little-prince',
          bookTitle: 'The Little Prince',
          bookAuthor: 'Antoine de Saint-Exupéry',
          pageNumber: 5,
          themes: JSON.stringify(['دوستی', 'حکمت', 'عشق']),
          length: 'کوتاه',
          isActive: true,
        },
      ]

      for (const q of DEFAULT_CURATED_QUOTES) {
        await db.quote.upsert({
          where: { slug: q.slug },
          update: q,
          create: q,
        })
      }
      quotes = await db.quote.findMany()
    }

    for (const quote of quotes) {
      const quoteSlug = quote.slug || slugify(quote.text.slice(0, 30))
      let parsedThemes: string[] = ['حکمت']
      try {
        if (typeof quote.themes === 'string') {
          const parsed = JSON.parse(quote.themes)
          if (Array.isArray(parsed)) parsedThemes = parsed
        }
      } catch {}

      const quoteData: any = {
        slug: quoteSlug,
        text: quote.text,
        textFa: quote.textFa || '',
        bookSlug: quote.bookSlug || '',
        bookTitle: quote.bookTitle || '',
        bookAuthor: quote.bookAuthor || '',
        pageNumber: quote.pageNumber || 1,
        themes: parsedThemes,
        length: (['کوتاه', 'متوسط', 'بلند'].includes(quote.length || '') ? quote.length : 'متوسط') as any,
        isActive: quote.isActive !== false,
      }

      const existing = await payload.find({
        collection: 'quotes',
        where: { slug: { equals: quoteSlug } },
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
    }
    logs.push(`Synced ${quotes.length} quotes.`)

    return NextResponse.json({ success: true, logs })
  } catch (err: any) {
    console.error('Payload sync route error:', err)
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 })
  }
}
