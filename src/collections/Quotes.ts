/**
 * src/collections/Quotes.ts
 * ---------------------------------------------------------------
 * Payload collection for curated bilingual quotes.
 *
 * Owner: Phase 2 R-PL.2
 * ---------------------------------------------------------------
 */

import type { CollectionConfig } from 'payload'

export const quotesCollection: CollectionConfig = {
  slug: 'quotes',
  labels: {
    singular: 'Quote',
    plural: 'Quotes',
  },
  admin: {
    useAsTitle: 'text',
    defaultColumns: ['text', 'bookTitle', 'bookAuthor', 'isActive'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'text',
      type: 'textarea',
      required: true,
      admin: { description: 'English quote text' },
    },
    {
      name: 'textFa',
      type: 'textarea',
      admin: { description: 'Persian translation' },
    },
    {
      name: 'bookSlug',
      type: 'text',
      admin: { description: 'Book slug (references Prisma Book)' },
    },
    {
      name: 'bookTitle',
      type: 'text',
    },
    {
      name: 'bookAuthor',
      type: 'text',
    },
    {
      name: 'pageNumber',
      type: 'number',
      defaultValue: 1,
    },
    {
      name: 'themes',
      type: 'text',
      hasMany: true,
      admin: { description: 'Theme tags (e.g. خوشبینی, عشق, حکمت)' },
    },
    {
      name: 'length',
      type: 'select',
      defaultValue: 'متوسط',
      options: [
        { label: 'کوتاه', value: 'کوتاه' },
        { label: 'متوسط', value: 'متوسط' },
        { label: 'بلند', value: 'بلند' },
      ],
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
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
