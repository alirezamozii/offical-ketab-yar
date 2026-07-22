'use client'

/**
 * use-reader-notifications — the single place in the reader tree where
 * `sonner` toast calls live.
 *
 * Audit 03 (§2.2 "toast.* inside business logic") flagged that the
 * god-hook called `toast.success`/`toast.error` directly from inside its
 * callbacks (8 sites). That couples the business logic to a specific UI
 * library (sonner) and makes the hook untestable without mocking the
 * toast global.
 *
 * This hook subscribes to the event bus (`useReaderEventBus`) and fires
 * the appropriate toast for each semantic event. Sub-hooks emit events
 * via the `emit` callback; they never touch sonner directly.
 */

import type { ReaderBusEntry } from '@/hooks/reader/use-reader-events'
import { useEffect } from 'react'
import { toast } from 'sonner'

export function useReaderNotifications(entry: ReaderBusEntry | null) {
  useEffect(() => {
    if (!entry) return
    switch (entry.event.type) {
      case 'highlight-added':
        toast.success('هایلایت ذخیره شد')
        break
      case 'vocab-added':
        toast.success('به واژگان اضافه شد')
        break
      case 'vocab-error':
        toast.error('خطا در افزودن')
        break
      case 'copied':
        toast.success('کپی شد')
        break
      case 'bookmark-added':
        toast.success('نشان‌گذاری شد')
        break
      case 'bookmark-removed':
        toast.success('نشان حذف شد')
        break
      case 'share-success':
        toast.success('لینک و متن کپی شد')
        break
      case 'share-error':
        toast.error('اشتراک‌گذاری ناموفق بود')
        break
    }
  }, [entry])
}
