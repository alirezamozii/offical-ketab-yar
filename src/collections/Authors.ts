/**
 * src/collections/Authors.ts
 * ---------------------------------------------------------------
 * Payload collection for authors.
 *
 * Owner: Phase 2 R-PL.2
 * ---------------------------------------------------------------
 */

import type { CollectionConfig } from 'payload'

export const authorsCollection: CollectionConfig = {
  slug: 'authors',
  labels: {
    singular: 'Author',
    plural: 'Authors',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'nameFa', 'era', 'featured'],
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
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'English name' },
    },
    {
      name: 'nameFa',
      type: 'text',
      admin: { description: 'Persian name' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'bio',
      type: 'textarea',
      admin: { description: 'English biography' },
    },
    {
      name: 'bioFa',
      type: 'textarea',
      admin: { description: 'Persian biography' },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'birthYear',
      type: 'number',
      admin: { position: 'sidebar' },
    },
    {
      name: 'deathYear',
      type: 'number',
      admin: { position: 'sidebar' },
    },
    {
      name: 'nationality',
      type: 'text',
    },
    {
      name: 'nationalityFa',
      type: 'text',
    },
    {
      name: 'era',
      type: 'select',
      options: [
        { label: 'Augustan', value: 'Augustan' },
        { label: 'Romantic', value: 'Romantic' },
        { label: 'Victorian', value: 'Victorian' },
        { label: 'Edwardian', value: 'Edwardian' },
        { label: 'Modern', value: 'Modern' },
        { label: 'Postmodern', value: 'Postmodern' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'eraFa',
      type: 'text',
    },
    {
      name: 'notableWorks',
      type: 'text',
      hasMany: true,
      admin: { description: 'Notable works (English titles)' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
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
