/**
 * src/collections/Books.ts
 * ---------------------------------------------------------------
 * Payload collection for books — replaces the Prisma Book model
 * for content management (the Prisma Book model stays for user-
 * data references via bookSlug).
 *
 * Owner: Phase 2 R-PL.2
 * ---------------------------------------------------------------
 */

import type { CollectionConfig } from 'payload'

export const booksCollection: CollectionConfig = {
  slug: 'books',
  labels: {
    singular: 'Book',
    plural: 'Books',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'level', 'pageCount', 'isPublished'],
    group: 'Content',
  },
  access: {
    // Public can read published books; only admins can create/edit
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'English title of the book' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-safe slug (e.g. alice-in-wonderland)',
        position: 'sidebar',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      required: true,
      admin: { description: 'The author of this book' },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Short book description (English)' },
    },
    {
      name: 'level',
      type: 'select',
      required: true,
      defaultValue: 'B1',
      options: [
        { label: 'A1 — مبتدی مطلق', value: 'A1' },
        { label: 'A2 — مبتدی', value: 'A2' },
        { label: 'B1 — متوسط', value: 'B1' },
        { label: 'B2 — متوسط پیشرفته', value: 'B2' },
        { label: 'C1 — پیشرفته', value: 'C1' },
        { label: 'C2 — مسلط', value: 'C2' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'genres',
      type: 'text',
      hasMany: true,
      admin: { description: 'Genre tags (e.g. Classic, Adventure, Fantasy)' },
    },
    {
      name: 'pageCount',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: { description: 'Total number of pages' },
    },
    {
      name: 'publishedYear',
      type: 'number',
      defaultValue: 1900,
      admin: { position: 'sidebar' },
    },
    {
      name: 'coverFrom',
      type: 'text',
      defaultValue: '#b8956a',
      admin: { description: 'Cover gradient start color (hex)' },
    },
    {
      name: 'coverTo',
      type: 'text',
      defaultValue: '#6d523a',
      admin: { description: 'Cover gradient end color (hex)' },
    },
    {
      name: 'coverAccent',
      type: 'text',
      defaultValue: '#f4d35e',
      admin: { description: 'Cover accent color (hex)' },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optional uploaded cover image (overrides gradient)' },
    },
    {
      name: 'isPublished',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'isPremium',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'allowDownload',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'viewCount',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'rating',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'reviewCount',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
    // Chapters — nested array
    {
      name: 'chapters',
      type: 'array',
      labels: { singular: 'Chapter', plural: 'Chapters' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'titleFa', type: 'text' },
        { name: 'slug', type: 'text', required: true },
        { name: 'order', type: 'number', defaultValue: 0 },
        { name: 'startPage', type: 'number', defaultValue: 1 },
      ],
      admin: {
        description: 'Chapter structure for the table of contents',
        initCollapsed: true,
      },
    },
    // Pages — nested array (the actual book content)
    {
      name: 'pages',
      type: 'array',
      labels: { singular: 'Page', plural: 'Pages' },
      fields: [
        { name: 'pageNumber', type: 'number', required: true },
        { name: 'english', type: 'textarea', required: true },
        { name: 'farsi', type: 'textarea' },
        {
          name: 'type',
          type: 'select',
          defaultValue: 'text',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Heading', value: 'heading' },
            { label: 'Image', value: 'image' },
            { label: 'Quote', value: 'quote' },
          ],
        },
        { name: 'meta', type: 'text' },
      ],
      admin: {
        description: 'The book pages (English + Persian translation)',
        initCollapsed: true,
      },
    },
  ],
  hooks: {
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
