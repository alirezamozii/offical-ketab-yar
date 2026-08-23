'use client'

import React, { useMemo } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'
import { WordBookEditor } from './WordBookEditor'

export const BookContentEditorField: React.FC<{ path: string }> = () => {
  // Hook into Payload Form state for pages & chapters
  const { value: rawPages, setValue: setPagesValue } = useField<any[]>({ path: 'pages' })
  const { value: rawChapters, setValue: setChaptersValue } = useField<any[]>({ path: 'chapters' })

  // Hook into other book form fields (title, slug, level)
  const bookMeta = useFormFields(([fields]) => ({
    title: (fields.title?.value as string) || 'کتاب',
    slug: (fields.slug?.value as string) || '',
    level: (fields.level?.value as string) || 'B1',
  }))

  const pages = useMemo(() => (Array.isArray(rawPages) ? rawPages : []), [rawPages])
  const chapters = useMemo(() => (Array.isArray(rawChapters) ? rawChapters : []), [rawChapters])

  return (
    <div className="book-custom-studio-field-root" dir="rtl">
      <WordBookEditor
        bookTitle={bookMeta.title}
        bookSlug={bookMeta.slug}
        bookLevel={bookMeta.level}
        pages={pages}
        chapters={chapters}
        onPagesChange={(newPages) => setPagesValue(newPages)}
        onChaptersChange={(newChapters) => setChaptersValue(newChapters)}
        showReaderPreviewLink={Boolean(bookMeta.slug)}
      />
    </div>
  )
}
