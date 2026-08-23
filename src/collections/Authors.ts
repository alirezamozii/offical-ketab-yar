/**
 * src/collections/Authors.ts
 * ---------------------------------------------------------------
 * Payload collection for authors with full Persian localization
 * and automated slug generation.
 * ---------------------------------------------------------------
 */

import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/utils'

export const authorsCollection: CollectionConfig = {
  slug: 'authors',
  labels: {
    singular: 'نویسنده',
    plural: '۱. نویسندگان (Authors)',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'nameFa', 'era', 'featured'],
    group: 'محتوای آموزشی و کتاب‌ها',
    description: 'مدیریت مشخصات، بیوگرافی و آثار نویسندگان کتاب‌ها',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      label: 'نام انگلیسی نویسنده',
      type: 'text',
      required: true,
      admin: { description: 'نام رسمی و لاتین نویسنده (مانند: Jane Austen)' },
    },
    {
      name: 'nameFa',
      label: 'نام فارسی نویسنده',
      type: 'text',
      admin: { description: 'نام نویسنده با خط فارسی (مانند: جین آستین)' },
    },
    {
      name: 'slug',
      label: 'شناسه یکتا (Slug)',
      type: 'text',
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'شناسه در URL (در صورت خالی گذاشتن، خودکار از نام تولید می‌شود)',
      },
    },
    {
      name: 'bio',
      label: 'بیوگرافی کوتاه انگلیسی',
      type: 'textarea',
      admin: { description: 'خلاصه معرفی نویسنده به زبان انگلیسی' },
    },
    {
      name: 'bioFa',
      label: 'بیوگرافی کوتاه فارسی',
      type: 'textarea',
      admin: { description: 'خلاصه معرفی نویسنده به زبان فارسی' },
    },
    {
      name: 'photo',
      label: 'تصویر پرتره نویسنده',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'birthYear',
      label: 'سال تولد (میلادی)',
      type: 'number',
      admin: { position: 'sidebar', description: 'مثال: 1812' },
    },
    {
      name: 'deathYear',
      label: 'سال وفات (میلادی)',
      type: 'number',
      admin: { position: 'sidebar', description: 'مثال: 1870 (برای نویسندگان در قید حیات خالی بگذارید)' },
    },
    {
      name: 'nationality',
      label: 'ملیت به انگلیسی',
      type: 'text',
      admin: { description: 'مثال: British, American, French' },
    },
    {
      name: 'nationalityFa',
      label: 'ملیت به فارسی',
      type: 'text',
      admin: { description: 'مثال: بریتانیایی، آمریکایی، فرانسوی' },
    },
    {
      name: 'era',
      label: 'دوره ادبی (Era)',
      type: 'select',
      defaultValue: 'Modern',
      options: [
        { label: 'دوران آگوستین (Augustan)', value: 'Augustan' },
        { label: 'دوران رمانتیک (Romantic)', value: 'Romantic' },
        { label: 'دوران ویکتوریایی (Victorian)', value: 'Victorian' },
        { label: 'دوران ادواردی (Edwardian)', value: 'Edwardian' },
        { label: 'دوران مدرن (Modern)', value: 'Modern' },
        { label: 'دوران پسا‌مدرن (Postmodern)', value: 'Postmodern' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'eraFa',
      label: 'نام فارسی دوره ادبی',
      type: 'text',
      admin: { description: 'مثال: عصر ویکتوریا، قرن بیستم' },
    },
    {
      name: 'notableWorks',
      label: 'آثار برجسته (عناوین انگلیسی)',
      type: 'text',
      hasMany: true,
      admin: { description: 'عناوین مهم‌ترین آثار نویسنده (با فشردن Enter جدا کنید)' },
    },
    {
      name: 'featured',
      label: 'نویسنده برگزیده (نمایش در ویترین)',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'biography',
      label: 'زندگی‌نامه کامل انگلیسی',
      type: 'textarea',
      admin: { description: 'متن تفصیلی زندگی‌نامه به زبان انگلیسی (پشتیبانی از Markdown)' },
    },
    {
      name: 'biographyFa',
      label: 'زندگی‌نامه کامل فارسی',
      type: 'textarea',
      admin: { description: 'متن تفصیلی زندگی‌نامه به زبان فارسی (پشتیبانی از Markdown)' },
    },
    {
      name: 'tags',
      label: 'برچسب‌های سبک و موضوع',
      type: 'text',
      hasMany: true,
      admin: { description: 'مانند: رمان کلاسیک، ادبیات داستانی، طنز اجتماعی' },
    },
    {
      name: 'website',
      label: 'آدرس وب‌سایت رسمی',
      type: 'text',
      admin: { description: 'اختیاری (مثال: https://author-website.com)' },
    },
    {
      name: 'wikipedia',
      label: 'لینک صفحه ویکی‌پدیا',
      type: 'text',
      admin: { description: 'اختیاری (مثال: https://en.wikipedia.org/wiki/...)' },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && (!data.slug || typeof data.slug !== 'string' || data.slug.trim() === '')) {
          const source = data.name || data.nameFa || 'author'
          data.slug = slugify(source)
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation }) => {
        const { syncAuthorToPrisma } = await import('../payload/sync')
        await syncAuthorToPrisma(doc, operation)
        return doc
      },
    ],
    afterDelete: [
      async ({ id }) => {
        const { deleteAuthorFromPrisma } = await import('../payload/sync')
        await deleteAuthorFromPrisma(id)
      },
    ],
  },
}
