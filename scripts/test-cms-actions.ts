/**
 * scripts/test-cms-actions.ts
 * Comprehensive test of all ContentStudio import flows & AI prompt sample JSONs.
 * CRUD runs through the Payload REST API (the exact path the admin UI uses),
 * so the running dev server must be up on :3000.
 * Run: npx tsx scripts/test-cms-actions.ts
 */

import fs from 'node:fs'
import path from 'node:path'

let pass = 0
let fail = 0
const failures: string[] = []
function log(ok: boolean, name: string, extra?: string) {
  if (ok) {
    pass++
    console.log(`  ✅ ${name}${extra ? ` — ${extra}` : ''}`)
  } else {
    fail++
    failures.push(name)
    console.error(`  ❌ ${name}${extra ? ` — ${extra}` : ''}`)
  }
}
async function step(name: string, fn: () => Promise<string | void>) {
  console.log(`▶ ${name}`)
  try {
    const extra = await fn()
    log(true, name, typeof extra === 'string' ? extra : undefined)
  } catch (err: any) {
    log(false, name, err?.message || String(err))
  }
}

const base = 'http://localhost:3000/api'

async function main() {
  const { parseAnyJsonPayload, normalizePages, normalizeChapters } = await import(
    '../src/lib/json-payload-helpers'
  )
  const prompts = await import('../src/payload/prompts/ai-prompts')

  // ═════════════ 1. Validate all AI prompt sample JSONs (pure functions) ═════════════
  console.log('\n═════ 1) اعتبارسنجی JSON نمونه‌ی ۷ پرامپت AI ═════')
  const promptSamples: [string, Record<string, any>][] = [
    ['AUTHOR_PROMPT', prompts.AUTHOR_PROMPT.sampleJson],
    ['BOOK_INFO_PROMPT', prompts.BOOK_INFO_PROMPT.sampleJson],
    ['BOOK_CONTENT_PAGES_PROMPT', prompts.BOOK_CONTENT_PAGES_PROMPT.sampleJson],
    ['FULL_BOOK_BUNDLE_PROMPT', prompts.FULL_BOOK_BUNDLE_PROMPT.sampleJson],
    ['BLOG_POST_PROMPT', prompts.BLOG_POST_PROMPT.sampleJson],
    ['QUOTES_PROMPT', prompts.QUOTES_PROMPT.sampleJson],
    ['EPUB_BATCH_TRANSLATE_PROMPT', prompts.EPUB_BATCH_TRANSLATE_PROMPT.sampleJson],
  ]
  for (const [name, sample] of promptSamples) {
    await step(`parse sample JSON → ${name}`, () => {
      const parsed = parseAnyJsonPayload(JSON.stringify(sample))
      if (!parsed || typeof parsed !== 'object') throw new Error('parse returned nothing')
    })
  }
  await step('buildEpubBatchAiPrompt با صفحات واقعی', () => {
    const p = prompts.buildEpubBatchAiPrompt(
      [{ pageNumber: 1, english: 'Hello world.\n\nSecond paragraph.' }],
      { bookTitle: 'QA Test Book', authorName: 'Test Author QA', level: 'B1', genres: ['Classic'] },
    )
    if (!p.includes('pages') || !p.includes('Hello world')) throw new Error('prompt payload missing')
    return `${p.length} chars`
  })
  await step('normalizeChapters/normalizePages با تناظر ۱:۱ پاراگراف', () => {
    const chapters = normalizeChapters([
      { order: 1, title: 'Chapter 1: Test', titleFa: 'فصل یک', slug: 'chapter-1-test', startPage: 1 },
    ])
    const pages = normalizePages([
      { pageNumber: 1, english: 'A.\n\nB.', farsi: 'الف.\n\nب.', type: 'text' },
    ])
    if (chapters.length !== 1) throw new Error(`chapters=${chapters.length}`)
    if (pages.length !== 1) throw new Error(`pages=${pages.length}`)
    const en = (pages[0].english.match(/\n\n/g) || []).length
    const fa = (pages[0].farsi.match(/\n\n/g) || []).length
    if (en !== fa) throw new Error(`parity broken en=${en} fa=${fa}`)
  })

  // ═════════════ 2. Admin login ═════════════
  console.log('\n═════ 2) لاگین ادمین ═════')
  let token = ''
  await step('POST /api/users/login', async () => {
    const r = await fetch(`${base}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alirezakaregar05@gmail.com', password: 'Kar147852369' }),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`)
    token = (await r.json()).token
  })
  const auth = { 'Content-Type': 'application/json', Authorization: `JWT ${token}` }

  // ═════════════ 3. Import Author flow ═════════════
  console.log('\n═════ 3) اکشن Import Author ═════')
  let authorId = ''
  await step('ایجاد نویسنده تستی (POST /api/authors)', async () => {
    const sample = parseAnyJsonPayload(JSON.stringify(prompts.AUTHOR_PROMPT.sampleJson))
    const r = await fetch(`${base}/authors`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        name: 'Test Author QA',
        nameFa: sample.nameFa,
        slug: 'test-author-qa',
        bio: sample.bio,
        bioFa: sample.bioFa,
        era: sample.era,
      }),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`)
    authorId = String((await r.json()).doc.id)
    return `id=${authorId}`
  })
  await step('ویرایش نویسنده (PATCH bio)', async () => {
    const r = await fetch(`${base}/authors/${authorId}`, {
      method: 'PATCH',
      headers: auth,
      body: JSON.stringify({ bio: 'Updated QA bio.' }),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`)
    const jd = await r.json(); const doc = jd.doc ?? jd
    if (doc.bio !== 'Updated QA bio.') throw new Error('bio not updated')
  })

  // ═════════════ 4. Import Book Info flow ═════════════
  console.log('\n═════ 4) اکشن Import Book Info ═════')
  let bookId = ''
  await step('ایجاد کتاب تستی (POST /api/books)', async () => {
    const sample = parseAnyJsonPayload(JSON.stringify(prompts.BOOK_INFO_PROMPT.sampleJson))
    const r = await fetch(`${base}/books`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        title: 'QA Test Book',
        slug: 'qa-test-book',
        author: Number(authorId),
        description: sample.description,
        level: sample.level,
        genres: sample.genres,
        pageCount: 0,
        publishedYear: sample.publishedYear,
        coverFrom: sample.coverFrom,
        coverTo: sample.coverTo,
        coverAccent: sample.coverAccent,
        isPublished: true,
        allowDownload: true,
      }),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`)
    bookId = String((await r.json()).doc.id)
    return `id=${bookId}`
  })
  await step('ویرایش مشخصات کتاب (PATCH level/description)', async () => {
    const r = await fetch(`${base}/books/${bookId}`, {
      method: 'PATCH',
      headers: auth,
      body: JSON.stringify({ level: 'B2', description: 'Edited via QA.' }),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`)
    const jd = await r.json(); const doc = jd.doc ?? jd
    if (doc.level !== 'B2') throw new Error(`level=${doc.level}`)
  })

  // ═════════════ 5. Import Book Content flow ═════════════
  console.log('\n═════ 5) اکشن Import Book Content (فصل/صفحه) ═════')
  await step('افزودن فصل و ۲ صفحه دوزبانه', async () => {
    const sample = parseAnyJsonPayload(JSON.stringify(prompts.BOOK_CONTENT_PAGES_PROMPT.sampleJson))
    const chapters = normalizeChapters([
      { order: 1, title: 'Chapter 1: QA', titleFa: 'فصل یک: تست', slug: 'chapter-1-qa', startPage: 1 },
    ])
    const pages = normalizePages([
      { pageNumber: 1, english: 'First test paragraph.\n\nSecond one.', farsi: 'پاراگراف اول.\n\nدومی.', type: 'text' },
      { pageNumber: 2, english: 'Page two text.', farsi: 'متن صفحه دو.', type: 'text' },
    ])
    const r = await fetch(`${base}/books/${bookId}`, {
      method: 'PATCH',
      headers: auth,
      body: JSON.stringify({ chapters, pages, pageCount: pages.length }),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`)
    const jd = await r.json(); const doc = jd.doc ?? jd
    if (doc.pages?.length !== 2 || doc.chapters.length !== 1)
      throw new Error(`stored pages=${doc.pages.length} chapters=${doc.chapters.length}`)
    return `pages=2 chapters=1`
  })
  await step('ویرایش متن صفحه ۱', async () => {
    const get = await fetch(`${base}/books/${bookId}`, { headers: auth })
    const j1 = await get.json(); const doc = j1.doc ?? j1
    const pages = [...(doc.pages ?? [])]
    pages[0] = { ...pages[0], english: 'Edited paragraph one.' }
    const r = await fetch(`${base}/books/${bookId}`, {
      method: 'PATCH',
      headers: auth,
      body: JSON.stringify({ pages }),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`)
    const j2 = await r.json(); const after = j2.doc ?? j2
    if (!after.pages[0].english.includes('Edited')) throw new Error('page edit not persisted')
  })
  await step('حذف صفحه ۲ (کم کردن محتوا)', async () => {
    const get = await fetch(`${base}/books/${bookId}`, { headers: auth })
    const j1 = await get.json(); const doc = j1.doc ?? j1
    const pages = (doc.pages ?? []).filter((_: any, i: number) => i !== 1)
    const r = await fetch(`${base}/books/${bookId}`, {
      method: 'PATCH',
      headers: auth,
      body: JSON.stringify({ pages, pageCount: pages.length }),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`)
    const j2 = await r.json(); const after = j2.doc ?? j2
    if (after.pages.length !== 1) throw new Error(`pages=${after.pages.length}`)
  })

  // ═════════════ 6. Import Full Bundle flow ═════════════
  console.log('\n═════ 6) اکشن Import Full Bundle ═════')
  await step('بروزرسانی کامل با پکیج همه‌جانبه', async () => {
    const sample = parseAnyJsonPayload(JSON.stringify(prompts.FULL_BOOK_BUNDLE_PROMPT.sampleJson))
    const chapters = normalizeChapters(sample.chapters || [])
    const pages = normalizePages(sample.pages || [])
    const r = await fetch(`${base}/books/${bookId}`, {
      method: 'PATCH',
      headers: auth,
      body: JSON.stringify({ chapters, pages, pageCount: pages.length || 1 }),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`)
    const jd = await r.json(); const doc = jd.doc ?? jd
    if (!doc.pages?.length) throw new Error('bundle pages not saved')
    return `pages=${doc.pages.length}`
  })

  // ═════════════ 7. Import Quotes flow ═════════════
  console.log('\n═════ 7) اکشن Import Quotes ═════')
  let quoteId = ''
  await step('ثبت نقل‌قول تستی متصل به کتاب', async () => {
    const sample = parseAnyJsonPayload(JSON.stringify(prompts.QUOTES_PROMPT.sampleJson))
    const body = {
      slug: 'qa-test-quote',
      text: 'This is a QA test quote.',
      textFa: sample.quotes[0].textFa,
      bookSlug: 'qa-test-book',
      bookTitle: 'QA Test Book',
      bookAuthor: 'Test Author QA',
      pageNumber: 1,
      themes: ['تست'],
      length: 'کوتاه',
      isActive: true,
      book: Number(bookId),
    }
    const find = await fetch(`${base}/quotes?where[slug][equals]=qa-test-quote`, { headers: auth })
    const existing = (await find.json()).docs
    let r: Response
    if (existing.length > 0) {
      quoteId = String(existing[0].id)
      r = await fetch(`${base}/quotes/${quoteId}`, { method: 'PATCH', headers: auth, body: JSON.stringify(body) })
    } else {
      r = await fetch(`${base}/quotes`, { method: 'POST', headers: auth, body: JSON.stringify(body) })
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`)
    const jd = await r.json(); const doc = jd.doc ?? jd
    quoteId = String(doc.id)
    return `quoteId=${quoteId}`
  })
  await step('ویرایش کوت (PATCH textFa)', async () => {
    const r = await fetch(`${base}/quotes/${quoteId}`, {
      method: 'PATCH',
      headers: auth,
      body: JSON.stringify({ textFa: 'کوتِ ویرایش‌شده.' }),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`)
  })

  // ═════════════ 8. Import Blog Post flow ═════════════
  console.log('\n═════ 8) اکشن Import Blog Post (سمت Payload) ═════')
  let postId = ''
  await step('ثبت مقاله تستی', async () => {
    const sample = parseAnyJsonPayload(JSON.stringify(prompts.BLOG_POST_PROMPT.sampleJson))
    const body = {
      title: 'QA Test Post',
      slug: 'qa-test-post',
      excerpt: sample.excerpt,
      tags: sample.tags,
      publishedAt: new Date().toISOString(),
      _status: 'published',
    }
    const find = await fetch(`${base}/blogPosts?where[slug][equals]=qa-test-post`, { headers: auth })
    const existing = (await find.json()).docs
    let r: Response
    if (existing.length > 0) {
      postId = String(existing[0].id)
      r = await fetch(`${base}/blogPosts/${postId}`, { method: 'PATCH', headers: auth, body: JSON.stringify(body) })
    } else {
      r = await fetch(`${base}/blogPosts`, { method: 'POST', headers: auth, body: JSON.stringify(body) })
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`)
    const jd = await r.json(); const doc = jd.doc ?? jd
    postId = String(doc.id)
    return `postId=${postId}`
  })

  // ═════════════ 9. Cleanup ═════════════
  console.log('\n═════ 9) پاکسازی داده‌های تستی (حذف) ═════')
  for (const [label, url] of [
    ['حذف کوت تستی', `${base}/quotes/${quoteId}`],
    ['حذف مقاله تستی', `${base}/blogPosts/${postId}`],
    ['حذف کتاب تستی', `${base}/books/${bookId}`],
    ['حذف نویسنده تستی', `${base}/authors/${authorId}`],
  ] as const) {
    await step(label, async () => {
      if (url.endsWith('/undefined')) throw new Error('id missing — previous step failed')
      const r = await fetch(url, { method: 'DELETE', headers: auth })
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`)
    })
  }

  console.log('\n══════════════════════════════════════')
  console.log(`نتیجه نهایی: ${pass} موفق، ${fail} ناموفق`)
  if (failures.length) {
    console.error('مراحل ناموفق: ' + failures.join(' | '))
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
