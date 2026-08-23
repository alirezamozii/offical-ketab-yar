/**
 * src/collections/Books.ts
 * ---------------------------------------------------------------
 * Payload collection for books with full Persian localization,
 * automated slug generation, and intelligent auto-palette extraction.
 * ---------------------------------------------------------------
 */

import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/utils'

export const booksCollection: CollectionConfig = {
  slug: 'books',
  labels: {
    singular: 'کتاب',
    plural: '۲. کتاب‌ها (Books)',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'level', 'pageCount', 'isPublished'],
    group: 'محتوای آموزشی و کتاب‌ها',
    description: 'مدیریت کتاب‌های دوزبانه، فصول و صفحات متن انگلیسی و فارسی',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'title',
      label: 'عنوان اصلی کتاب (انگلیسی)',
      type: 'text',
      required: true,
      admin: { description: 'عنوان لاتین کتاب (مانند: Pride and Prejudice)' },
    },
    {
      name: 'slug',
      label: 'شناسه یکتا (Slug)',
      type: 'text',
      unique: true,
      admin: {
        description: 'شناسه در URL (در صورت خالی بودن خودکار از عنوان تولید می‌شود)',
        position: 'sidebar',
      },
    },
    {
      name: 'author',
      label: 'نویسنده کتاب',
      type: 'relationship',
      relationTo: 'authors',
      required: true,
      admin: { description: 'انتخاب نویسنده از میان نویسندگان ثبت شده' },
    },
    {
      name: 'coverImage',
      label: 'تصویر جلد اختصاصی کتاب (Cover Art)',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'با آپلود تصویر، رنگ‌های گرادینت و المان‌های تأکیدی به صورت کاملاً هوشمند از تصویر جلد استخراج می‌شوند.',
      },
    },
    {
      name: 'description',
      label: 'خلاصه و معرفی کتاب',
      type: 'textarea',
      admin: { description: 'توضیح کوتاه و معرفی داستان برای کاربران' },
    },
    {
      name: 'level',
      label: 'سطح دشواری زبان (CEFR)',
      type: 'select',
      required: true,
      defaultValue: 'B1',
      options: [
        { label: 'A1 — مبتدی کامل (Beginner)', value: 'A1' },
        { label: 'A2 — مقدماتی (Elementary)', value: 'A2' },
        { label: 'B1 — متوسط (Intermediate)', value: 'B1' },
        { label: 'B2 — متوسط پیشرفته (Upper Intermediate)', value: 'B2' },
        { label: 'C1 — پیشرفته (Advanced)', value: 'C1' },
        { label: 'C2 — مسلط و نیتیو (Mastery)', value: 'C2' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'genres',
      label: 'دسته‌بندی و ژانرها',
      type: 'text',
      hasMany: true,
      admin: { description: 'مانند: Classic, Adventure, Drama, Mystery (با اینتر جدا کنید)' },
    },
    {
      name: 'pageCount',
      label: 'تعداد کل صفحات',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: { description: 'تعداد کل صفحات کتاب (خودکار با صفحات وارد شده سینک می‌شود)' },
    },
    {
      name: 'publishedYear',
      label: 'سال انتشار اصلی',
      type: 'number',
      defaultValue: 1900,
      admin: { position: 'sidebar', description: 'سال انتشار کتاب به میلادی (مثال: 1813)' },
    },
    {
      name: 'coverFrom',
      label: 'رنگ شروع گرادینت (تولید خودکار هوشمند)',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'تولید کاملاً خودکار بر اساس تصویر جلد یا ژانر (نیازی به تغییر دستی نیست)',
      },
    },
    {
      name: 'coverTo',
      label: 'رنگ پایان گرادینت (تولید خودکار هوشمند)',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'تولید خودکار بر اساس تیرگی و تم جلد',
      },
    },
    {
      name: 'coverAccent',
      label: 'رنگ المان تأکیدی (تولید خودکار هوشمند)',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'تولید خودکار با بالاترین کنتراست برای دکمه‌ها و بج‌ها',
      },
    },
    {
      name: 'isPublished',
      label: 'وضعیت انتشار عمومی',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'نمایش کتاب در کتابخانه و اپلیکیشن' },
    },
    {
      name: 'isPremium',
      label: 'مخصوص اعضای ویژه (پرمیوم)',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'allowDownload',
      label: 'امکان دانلود فایل',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'viewCount',
      label: 'تعداد کل بازدیدها',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'rating',
      label: 'میانگین امتیاز کاربران',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'reviewCount',
      label: 'تعداد نظرات ثبت شده',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
    // Chapters — stored in document & managed seamlessly in BookContentEditorField
    {
      name: 'chapters',
      label: 'فصل‌بندی کتاب (Chapters)',
      type: 'array',
      admin: {
        initCollapsed: true,
        description: 'فصل‌بندی کتاب (به صورت خودکار و بصری در استودیوی نگارش بالا قابل مدیریت است)',
      },
      labels: { singular: 'فصل', plural: 'فصل‌ها' },
      fields: [
        { name: 'title', label: 'عنوان انگلیسی فصل', type: 'text', required: true },
        { name: 'titleFa', label: 'عنوان فارسی فصل', type: 'text' },
        { name: 'slug', label: 'شناسه فصل (Slug)', type: 'text' },
        { name: 'order', label: 'ترتیب فصل', type: 'number', defaultValue: 1 },
        { name: 'startPage', label: 'شماره صفحه شروع', type: 'number', defaultValue: 1 },
      ],
    },
    // Pages — custom Word-like visual parallel editor
    {
      name: 'pages',
      label: 'صفحات دوزبانه کتاب (Pages)',
      type: 'array',
      admin: {
        components: {
          Field: '@/payload/components/BookContentEditorField#BookContentEditorField',
        },
        description: 'محتوای متنی دوزبانه کتاب برای مطالعه در کتاب‌خوان',
        initCollapsed: true,
      },
      labels: { singular: 'صفحه', plural: 'صفحات' },
      fields: [
        { name: 'pageNumber', label: 'شماره صفحه', type: 'number', required: true },
        { name: 'english', label: 'متن انگلیسی صفحه', type: 'textarea', required: true },
        { name: 'farsi', label: 'ترجمه فارسی هم‌تراز', type: 'textarea' },
        {
          name: 'type',
          label: 'نوع صفحه',
          type: 'select',
          defaultValue: 'text',
          options: [
            { label: 'متن معمولی (Text)', value: 'text' },
            { label: 'تیتر فصل (Heading)', value: 'heading' },
            { label: 'تصویر تصویرگری (Image)', value: 'image' },
            { label: 'نقل‌قول برگزیده (Quote)', value: 'quote' },
          ],
        },
        { name: 'meta', label: 'متادیتا (اختیاری)', type: 'text' },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (data && (!data.slug || typeof data.slug !== 'string' || data.slug.trim() === '')) {
          const source = data.title || 'book'
          data.slug = slugify(source)
        }
        if (data && Array.isArray(data.pages)) {
          if (!data.pageCount || data.pageCount === 0) {
            data.pageCount = data.pages.length
          }
        }

        // 1. Auto-extract colors from uploaded cover image
        if (data?.coverImage && req?.payload) {
          try {
            const { extractColorsFromMediaDoc } = await import('../lib/book-palette')
            const extracted = await extractColorsFromMediaDoc(data.coverImage, req.payload)
            if (extracted) {
              data.coverFrom = extracted.coverFrom
              data.coverTo = extracted.coverTo
              data.coverAccent = extracted.coverAccent
            }
          } catch {
            // Ignored
          }
        }

        // 2. If colors are not set or missing, intelligently generate from title & genres
        if (data && (!data.coverFrom || !data.coverTo || !data.coverAccent)) {
          try {
            const { generateBookPalette } = await import('../lib/book-palette')
            const palette = generateBookPalette(data.title || '', data.genres || [])
            if (!data.coverFrom) data.coverFrom = palette.coverFrom
            if (!data.coverTo) data.coverTo = palette.coverTo
            if (!data.coverAccent) data.coverAccent = palette.coverAccent
          } catch {
            // Ignored
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, operation }) => {
        const { syncBookToPrisma } = await import('../payload/sync')
        await syncBookToPrisma(doc, operation)
        return doc
      },
    ],
    afterDelete: [
      async ({ id }) => {
        const { deleteBookFromPrisma } = await import('../payload/sync')
        await deleteBookFromPrisma(id)
      },
    ],
  },
}
