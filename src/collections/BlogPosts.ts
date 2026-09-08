/**
 * src/collections/BlogPosts.ts
 * ---------------------------------------------------------------
 * Payload collection for blog posts with Persian localization
 * and automated slug generation.
 * ---------------------------------------------------------------
 */

import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/utils'
import { canDeleteContent } from '../payload/access'

export const blogPostsCollection: CollectionConfig = {
  slug: 'blogPosts',
  labels: {
    singular: 'مقاله',
    plural: '۳. وبلاگ و مقالات (Blog Posts)',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'publishedAt', '_status'],
    group: 'محتوای آموزشی و کتاب‌ها',
    description: 'مدیریت مقالات آموزشی، نقد کتاب و نکات یادگیری زبان',
    livePreview: {
      url: ({ data }) => `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${data?.slug || ''}`,
    },
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return {
        _status: { equals: 'published' },
      }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => canDeleteContent(user),
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 10,
  },
  fields: [
    {
      name: 'title',
      label: 'عنوان مقاله',
      type: 'text',
      required: true,
      admin: { description: 'عنوان اصلی و جذاب برای مقاله وبلاگ' },
    },
    {
      name: 'slug',
      label: 'شناسه یکتا (Slug)',
      type: 'text',
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'شناسه در URL (در صورت خالی بودن خودکار از عنوان تولید می‌شود)',
      },
    },
    {
      name: 'excerpt',
      label: 'خلاصه کوتاه مقاله (Excerpt)',
      type: 'textarea',
      admin: { description: 'خلاصه‌ای کوتاه که در کارت‌های وبلاگ و نتایج گوگل نمایش داده می‌شود' },
    },
    {
      name: 'content',
      label: 'متن کامل مقاله',
      type: 'richText',
      admin: { description: 'متن کامل به همراه تیترها، کوت‌ها و تصاویر' },
    },
    {
      name: 'cover',
      label: 'تصویر شاخص مقاله',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'tags',
      label: 'برچسب‌های موضوعی (Tags)',
      type: 'text',
      hasMany: true,
      admin: { description: 'مانند: یادگیری زبان، کتاب‌خوانی، لغات کلیدی (با فشردن Enter جدا کنید)' },
    },
    {
      name: 'relatedBook',
      label: 'کتاب مرتبط با مقاله (اختیاری)',
      type: 'relationship',
      relationTo: 'books',
      admin: {
        position: 'sidebar',
        description: 'در صورت ارتباط مقاله با یکی از کتاب‌ها، آن را انتخاب کنید',
      },
    },
    {
      name: 'author',
      label: 'نویسنده مقاله',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      label: 'تاریخ و زمان انتشار',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'تاریخ انتشار مقاله در سایت',
        date: { timeFormat: 'HH:mm' },
      },
    },
    {
      name: 'viewCount',
      label: 'تعداد کل بازدیدها',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && (!data.slug || typeof data.slug !== 'string' || data.slug.trim() === '')) {
          const source = data.title || 'blog-post'
          data.slug = slugify(source)
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation }) => {
        const { syncBlogPostToPrisma } = await import('../payload/sync')
        await syncBlogPostToPrisma(doc, operation)
        return doc
      },
    ],
    afterDelete: [
      async ({ id }) => {
        const { deleteBlogPostFromPrisma } = await import('../payload/sync')
        await deleteBlogPostFromPrisma(id)
      },
    ],
  },
}
