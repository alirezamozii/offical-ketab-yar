import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { processCoverImage } from '@/lib/extract-colors'
import { requireAdmin } from '@/lib/auth-session'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

/**
 * POST /api/books/[slug]/cover
 * ─────────────────────────────────────────────────────────────────────────
 * Upload a book cover image. The server:
 *   1. Validates the image (type, size ≤ 5MB)
 *   2. Converts it to WebP (600×900 max, quality 82) — saves to public/covers/
 *   3. AUTO-EXTRACTS the 2 dominant colors + accent from the image
 *      (see src/lib/extract-colors.ts)
 *   4. Updates the book's coverFrom, coverTo, coverAccent, AND coverImage
 *      fields in the database.
 *
 * After this, EVERYTHING that uses the book's colors — the bottom-nav
 * "ادامه" orb, the book detail page background glow, the BookCover
 * component — will AUTOMATICALLY reflect the uploaded image's palette.
 * No code changes needed.
 *
 * Request:
 *   multipart/form-data with a `file` field (PNG/JPEG/WebP, ≤5MB)
 *
 * Response:
 *   200 { slug, coverImage, coverFrom, coverTo, coverAccent }
 *   400 { error } — bad request (missing file, wrong type, too big)
 *   404 { error } — book not found
 *   500 { error } — server error
 */
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const COVERS_DIR = path.join(process.cwd(), 'public', 'covers')

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  // 🔒 Admin-only — this mutates book DB fields and writes files to disk.
  // Returns 404 (not 401) to hide the endpoint's existence from non-admins,
  // matching the convention used by all /api/admin/* routes.
  // NOTE: must be OUTSIDE the try/catch below — notFound() throws a special
  // error that the catch block would otherwise swallow into a 500.
  await requireAdmin()

  try {
    const { slug } = await params

    // 1. Verify the book exists.
    const book = await db.book.findUnique({ where: { slug } })
    if (!book) {
      return NextResponse.json(
        { error: 'کتاب مورد نظر یافت نشد.' },
        { status: 404 },
      )
    }

    // 2. Parse the multipart form.
    const formData = await req.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'فایل تصویر ارسال نشده است.' },
        { status: 400 },
      )
    }

    // 3. Validate type + size.
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'فرمت تصویر پشتیبانی نمی‌شود. PNG، JPEG، WebP یا GIF ارسال کنید.' },
        { status: 400 },
      )
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'حجم تصویر بیش از ۵ مگابایت است.' },
        { status: 400 },
      )
    }

    // 4. Read the file buffer.
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 5. Process: convert to WebP + extract dominant colors.
    const { colors, imageUrl, imageBuffer } = await processCoverImage(
      buffer,
      slug,
      COVERS_DIR,
    )

    // 6. Ensure the covers directory exists, then write the WebP file.
    await mkdir(COVERS_DIR, { recursive: true })
    const outputPath = path.join(COVERS_DIR, `${slug}.webp`)
    await writeFile(outputPath, imageBuffer)

    // 7. Update the book in the database with the extracted colors +
    //    the cover image URL.
    const updated = await db.book.update({
      where: { slug },
      data: {
        coverFrom: colors.from,
        coverTo: colors.to,
        coverAccent: colors.accent,
        coverImage: imageUrl,
      },
      select: {
        slug: true,
        coverImage: true,
        coverFrom: true,
        coverTo: true,
        coverAccent: true,
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[cover upload] error:', err)
    return NextResponse.json(
      { error: 'خطا در پردازش تصویر. لطفاً دوباره تلاش کنید.' },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/books/[slug]/cover
 * ─────────────────────────────────────────────────────────────────────────
 * Remove the uploaded cover image + reset the colors to the procedural
 * defaults (the original coverFrom/coverTo/coverAccent that were set when
 * the book was seeded).
 *
 * For now this just nulls coverImage and keeps the current colors. If you
 * want to restore the original seeded colors, you'd need to store them
 * separately (e.g. in a `coverFromOriginal` field) — left as a TODO.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  // 🔒 Admin-only — outside try/catch so notFound() isn't swallowed into 500.
  await requireAdmin()

  try {
    const { slug } = await params
    const book = await db.book.findUnique({ where: { slug } })
    if (!book) {
      return NextResponse.json(
        { error: 'کتاب مورد نظر یافت نشد.' },
        { status: 404 },
      )
    }

    await db.book.update({
      where: { slug },
      data: { coverImage: null },
    })

    return NextResponse.json({ slug, coverImage: null })
  } catch (err) {
    console.error('[cover delete] error:', err)
    return NextResponse.json(
      { error: 'خطا در حذف تصویر.' },
      { status: 500 },
    )
  }
}
