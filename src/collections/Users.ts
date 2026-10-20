import type { CollectionConfig } from 'payload'

export const UsersCollection: CollectionConfig = {
  slug: 'users',
  auth: true,
  labels: {
    singular: 'مدیر سیستم',
    plural: '۶. مدیران سیستم (Admins)',
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role', 'createdAt'],
    group: 'تنظیمات و رسانه',
    description: 'مدیریت حساب‌های کاربری مدیران پنل و سطوح دسترسی',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: async ({ req }) => {
      if (!req.user) {
        try {
          const count = await req.payload.count({ collection: 'users' })
          return count.totalDocs === 0
        } catch {
          return false
        }
      }
      return req.user.role === 'owner'
    },
    update: ({ req: { user }, id }) => {
      if (!user) return false
      if (user.role === 'owner') return true
      return user.id === id
    },
    delete: ({ req: { user }, id }) => {
      if (!user || user.role !== 'owner') return false
      return user.id !== id
    },
  },
  fields: [
    {
      name: 'name',
      label: 'نام و نام خانوادگی',
      type: 'text',
      admin: {
        description: 'نام کامل مدیر پنل',
      },
    },
    {
      name: 'role',
      label: 'نقش و سطح دسترسی',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'مالک اصلی (Owner - دسترسی نامحدود)', value: 'owner' },
        { label: 'مدیر ارشد (Admin - مدیریت کامل)', value: 'admin' },
        { label: 'ویرایشگر (Editor - فقط ثبت و ویرایش محتوا)', value: 'editor' },
      ],
      access: {
        update: ({ req: { user } }) => user?.role === 'owner',
      },
      admin: {
        position: 'sidebar',
        description: 'سطح دسترسی کاربر در پنل ادمین',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create') {
          try {
            const count = await req.payload.count({ collection: 'users' })
            if (count.totalDocs === 0) {
              data.role = 'owner'
            }
          } catch {
            // Never grant ownership when the bootstrap check is unavailable.
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc }) => {
        if (!doc.email) return doc
        try {
          const { db, isDbOffline } = await import('@/lib/db')
          if (isDbOffline()) return doc
          const roleMapping = doc.role === 'owner' ? 'OWNER' : doc.role === 'admin' ? 'ADMIN' : 'USER'
          await db.user.upsert({
            where: { email: doc.email },
            update: {
              name: doc.name || undefined,
              role: roleMapping,
            },
            create: {
              email: doc.email,
              name: doc.name || 'مدیر سیستم',
              role: roleMapping,
            },
          })
        } catch (err) {
          console.error('[Sync User Error]', err)
        }
        return doc
      },
    ],
  },
}
