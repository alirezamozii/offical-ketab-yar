/**
 * src/collections/BlogPosts.ts
 * ---------------------------------------------------------------
 * Payload collection for blog posts — with draft/publish workflow.
 *
 * Owner: Phase 2 R-PL.2
 * ---------------------------------------------------------------
 */

import type { CollectionConfig } from 'payload'

export const blogPostsCollection: CollectionConfig = {
  slug: 'blogPosts',
  labels: {
    singular: 'Blog Post',
    plural: 'Blog Posts',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'publishedAt', '_status'],
    group: 'Content',
    livePreview: {
      url: ({ data }) => `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${data?.slug || ''}`,
    },
  },
  access: {
    read: ({ req: { user } }) => {
      // Public can read published; admins can read drafts
      if (user) return true
      return {
        _status: { equals: 'published' },
      }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
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
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: { description: 'Short summary shown in the blog list' },
    },
    {
      name: 'content',
      type: 'richText',
      admin: { description: 'Full article content (Markdown/Lexical)' },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
      admin: { description: 'Topic tags (e.g. یادگیری زبان, روش مطالعه)' },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'When the post goes live (future dates stay hidden)',
        date: { timeFormat: 'HH:mm' },
      },
    },
    {
      name: 'viewCount',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
  hooks: {
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
