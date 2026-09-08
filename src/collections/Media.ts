/**
 * src/collections/Media.ts
 * ---------------------------------------------------------------
 * Payload's upload collection for images (book covers, author photos, blog covers).
 * ---------------------------------------------------------------
 */

import type { CollectionConfig } from 'payload'
import { canDeleteContent } from '../payload/access'

export const mediaCollection: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'رسانه و تصویر',
    plural: '۵. رسانه‌ها و تصاویر (Media)',
  },
  admin: {
    group: 'تنظیمات و رسانه',
    defaultColumns: ['filename', 'mimeType', 'width', 'height'],
    description: 'مدیریت و آپلود تصاویر جلد کتاب‌ها، تصاویر نویسندگان و وبلاگ',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => canDeleteContent(user),
  },
  upload: {
    staticDir: 'public/media',
    imageSizes: [
      { name: 'large', width: 1920, height: 1080, position: 'centre' },
      { name: 'medium', width: 768, height: 768, position: 'centre' },
      { name: 'small', width: 400, height: 400, position: 'centre' },
      { name: 'thumbnail', width: 150, height: 150, position: 'centre' },
    ],
    // SVG can execute active content when served from the application origin.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  fields: [
    {
      name: 'alt',
      label: 'متن جایگزین (Alt Text)',
      type: 'text',
      admin: { description: 'توضیح تصویر برای دسترسی‌پذیری و سئو (به فارسی یا انگلیسی)' },
    },
    {
      name: 'blurhash',
      label: 'کد تاری تصویر (Blurhash)',
      type: 'text',
      admin: { description: 'کد پیش‌نمایش تصویر قبل از لود کامل' },
    },
  ],
}
