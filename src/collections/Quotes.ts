/**
 * src/collections/Quotes.ts
 * ---------------------------------------------------------------
 * Payload collection for curated bilingual quotes with Persian
 * localization and auto-slug generation.
 * ---------------------------------------------------------------
 */

import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/utils'
import { canDeleteContent } from '../payload/access'

export const quotesCollection: CollectionConfig = {
  slug: 'quotes',
  labels: {
    singular: 'کوت',
    plural: '۴. کوت‌ها (Quotes)',
  },
  admin: {
    useAsTitle: 'text',
    defaultColumns: ['text', 'bookTitle', 'bookAuthor', 'isActive'],
    group: 'محتوای آموزشی و کتاب‌ها',
    description: 'جملات قصار و برگزیده کتاب‌ها برای تمرین و نمایش روزانه',
  },
  access: {
    read: ({ req: { user } }) => user ? true : { isActive: { equals: true } },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => canDeleteContent(user),
  },
  fields: [
    {
      name: 'slug',
      label: 'شناسه یکتا (Slug)',
      type: 'text',
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'شناسه یکتا (در صورت خالی بودن خودکار از متن تولید می‌شود)',
      },
    },
    {
      name: 'text',
      label: 'متن کوت به انگلیسی',
      type: 'textarea',
      required: true,
      admin: { description: 'متن جمله یا پاراگراف برگزیده به زبان انگلیسی' },
    },
    {
      name: 'textFa',
      label: 'ترجمه فارسی کوت',
      type: 'textarea',
      admin: { description: 'ترجمه دقیق و روان جمله به زبان فارسی' },
    },
    {
      name: 'book',
      label: 'کتاب منبع',
      type: 'relationship',
      relationTo: 'books',
      admin: {
        description: 'انتخاب کتاب مربوطه (با انتخاب، نام کتاب و نویسنده خودکار پر می‌شود)',
      },
    },
    {
      name: 'bookSlug',
      label: 'شناسه کتاب (Book Slug)',
      type: 'text',
      admin: { description: 'شناسه کتاب متصل شده' },
    },
    {
      name: 'bookTitle',
      label: 'عنوان کتاب',
      type: 'text',
      admin: { description: 'نام کتاب به انگلیسی یا فارسی' },
    },
    {
      name: 'bookAuthor',
      label: 'نام نویسنده',
      type: 'text',
      admin: { description: 'نام نویسنده کتاب' },
    },
    {
      name: 'pageNumber',
      label: 'شماره صفحه در کتاب',
      type: 'number',
      defaultValue: 1,
      admin: { description: 'شماره صفحه‌ای که این کوت در آن آمده است' },
    },
    {
      name: 'themes',
      label: 'موضوعات و برچسب‌ها (Themes)',
      type: 'text',
      hasMany: true,
      admin: { description: 'مانند: امید، شجاعت، عشق، انگیزه، خرد (با زدن Enter جدا کنید)' },
    },
    {
      name: 'length',
      label: 'طول کوت',
      type: 'select',
      defaultValue: 'متوسط',
      options: [
        { label: 'کوتاه (کمتر از ۱۵ کلمه)', value: 'کوتاه' },
        { label: 'متوسط (۱۵ الی ۴۰ کلمه)', value: 'متوسط' },
        { label: 'بلند (بیش از ۴۰ کلمه)', value: 'بلند' },
      ],
    },
    {
      name: 'displayOrder',
      label: 'اولویت و ترتیب نمایش',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
    {
      name: 'isActive',
      label: 'فعال در سیستم',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'نمایش این کوت در صفحه اصلی و اپلیکیشن' },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && (!data.slug || typeof data.slug !== 'string' || data.slug.trim() === '')) {
          const source = data.text ? data.text.slice(0, 30) : 'quote'
          data.slug = slugify(source)
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, req }) => {
        if (data?.book && req.payload) {
          try {
            const bookId = typeof data.book === 'object' ? data.book.id : data.book
            const bookDoc = await req.payload.findByID({
              collection: 'books',
              id: bookId,
              depth: 1,
            })
            if (bookDoc) {
              if (!data.bookSlug) data.bookSlug = bookDoc.slug
              if (!data.bookTitle) data.bookTitle = bookDoc.title
              if (!data.bookAuthor && bookDoc.author) {
                data.bookAuthor = typeof bookDoc.author === 'object' ? bookDoc.author.name : ''
              }
            }
          } catch {
            // Ignored
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation }) => {
        const { syncQuoteToPrisma } = await import('../payload/sync')
        await syncQuoteToPrisma(doc, operation)
        return doc
      },
    ],
    afterDelete: [
      async ({ id }) => {
        const { deleteQuoteFromPrisma } = await import('../payload/sync')
        await deleteQuoteFromPrisma(id)
      },
    ],
  },
}
