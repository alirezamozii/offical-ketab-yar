/**
 * src/collections/Media.ts
 * ---------------------------------------------------------------
 * Payload's built-in upload collection for images (book covers,
 * author photos, blog covers). Handles resizing + storage.
 *
 * Owner: Phase 2 R-PL.2
 * ---------------------------------------------------------------
 */

import type { CollectionConfig } from 'payload'

export const mediaCollection: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Media',
    plural: 'Media',
  },
  admin: {
    group: 'Content',
    defaultColumns: ['filename', 'mimeType', 'width', 'height'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  upload: {
    // Image sizes — auto-generated on upload
    imageSizes: [
      { name: 'large', width: 1920, height: 1080, position: 'centre' },
      { name: 'medium', width: 768, height: 768, position: 'centre' },
      { name: 'small', width: 400, height: 400, position: 'centre' },
      { name: 'thumbnail', width: 150, height: 150, position: 'centre' },
    ],
    // Accepted MIME types
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      admin: { description: 'Alt text for accessibility (Persian or English)' },
    },
    {
      name: 'blurhash',
      type: 'text',
      admin: { description: 'Base64 LQIP placeholder (auto-generated)' },
    },
  ],
}
