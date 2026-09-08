import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth-session'
import { db } from '@/lib/db'
import { logAuditAction } from '@/lib/audit'
import { getClientIpHash } from '@/lib/rate-limit'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import sharp from 'sharp'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
])

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

/**
 * Admin Image Upload Endpoint
 * POST /api/admin/upload
 *
 * Accepts multipart/form-data with a `file` field.
 * Restricts access to ADMIN or OWNER roles.
 * Saves upload to `public/uploads/` and tracks entry in `ImageAsset` table.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminApi()
    if (user instanceof NextResponse) return user

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'فایل تصویر ارسال نشده است.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.' },
        { status: 400 }
      )
    }

    const mimeType = file.type.toLowerCase()
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: 'فرمت فایل پشتیبانی نمی‌شود. فقط تصاویر مجاز هستند.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    let image: { data: Buffer; info: sharp.OutputInfo }
    try {
      image = await sharp(Buffer.from(bytes), { limitInputPixels: 40_000_000 })
        .rotate()
        .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer({ resolveWithObject: true })
    } catch {
      return NextResponse.json({ error: 'محتوای فایل یک تصویر معتبر نیست.' }, { status: 400 })
    }

    const filename = `${randomUUID()}.webp`

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const filepath = join(uploadDir, filename)
    await writeFile(filepath, image.data, { flag: 'wx' })

    const publicUrl = `/uploads/${filename}`

    let asset: { id: string }
    try {
      asset = await db.imageAsset.create({
        data: {
          userId: user.id,
          filename,
          originalUrl: publicUrl,
          mimeType: 'image/webp',
          sizeBytes: image.data.length,
          width: image.info.width,
          height: image.info.height,
          alt: file.name.slice(0, 240),
        },
        select: { id: true },
      })
    } catch (error) {
      await unlink(filepath).catch(() => {})
      throw error
    }

    const ipHash = await getClientIpHash(req)
    await logAuditAction({
      actorId: user.id,
      action: 'ADMIN_IMAGE_UPLOAD',
      target: asset.id,
      details: { filename, url: publicUrl, sizeBytes: image.data.length },
      ipHash,
    }).catch((error) => console.error('[/api/admin/upload] Audit log failed:', error))

    return NextResponse.json({
      success: true,
      url: publicUrl,
      assetId: asset.id,
      filename,
    })
  } catch (err) {
    console.error('[/api/admin/upload] Upload error:', err)
    return NextResponse.json(
      { error: 'خطا در آپلود تصویر. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    )
  }
}
