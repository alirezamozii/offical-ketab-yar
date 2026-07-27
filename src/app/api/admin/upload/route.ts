import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-session'
import { db } from '@/lib/db'
import { logAuditAction } from '@/lib/audit'
import { getClientIpHash } from '@/lib/rate-limit'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

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
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز.' }, { status: 403 })
    }

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
    const buffer = Buffer.from(bytes)

    const ext = mimeType.split('/')[1] || 'png'
    const sanitizeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${sanitizeName}.${ext}`

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    const publicUrl = `/uploads/${filename}`

    const asset = await db.imageAsset.create({
      data: {
        userId: user.id,
        filename,
        originalUrl: publicUrl,
        mimeType,
        sizeBytes: file.size,
        alt: file.name,
      },
    })

    const ipHash = await getClientIpHash(req)
    await logAuditAction({
      actorId: user.id,
      action: 'ADMIN_IMAGE_UPLOAD',
      target: asset.id,
      details: { filename, url: publicUrl, sizeBytes: file.size },
      ipHash,
    })

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
