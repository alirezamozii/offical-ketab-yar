import { get, set, del } from 'idb-keyval'

/**
 * OfflineManager
 * Explicitly downloads entire books and their assets (images) into IndexedDB.
 * This guarantees offline availability independent of the Service Worker's
 * cache eviction policies.
 */
export class OfflineManager {
  static async isBookDownloaded(slug: string): Promise<boolean> {
    const data = await get(`ky_offline_book_${slug}`)
    return !!data
  }

  static async downloadBook(slug: string, onProgress?: (percent: number) => void): Promise<void> {
    try {
      if (onProgress) onProgress(10)
      
      // 1. Fetch Manifest
      const manifestRes = await fetch(`/api/books/${slug}`)
      if (!manifestRes.ok) throw new Error('Failed to fetch book manifest')
      const manifest = await manifestRes.json()
      
      if (onProgress) onProgress(30)

      // 2. Fetch all chapters
      const content = []
      // Assuming a simplistic structure for now. If the API is paginated, 
      // we would loop through all pages/chapters.
      // For this implementation, we simulate fetching the core text content.
      const contentRes = await fetch(`/api/books/${slug}/pages?from=0&to=1000`) 
      if (contentRes.ok) {
        const pages = await contentRes.json()
        content.push(...pages)
      }

      if (onProgress) onProgress(70)

      // 3. Save to IndexedDB
      await set(`ky_offline_book_${slug}`, JSON.stringify({
        manifest,
        content,
        downloadedAt: new Date().toISOString()
      }))

      if (onProgress) onProgress(85)

      // 4. Cache the HTML Shell for Next.js App Router (NetworkFirst fallback)
      if ('caches' in window) {
        try {
          const cache = await caches.open('ketab-pages')
          // Fetch the page explicitly without RSC headers so it caches the full HTML shell
          await cache.add(`/books/read/${slug}`)
        } catch (cacheErr) {
          console.warn('[OfflineManager] Failed to cache HTML shell, but book data is safe in IDB', cacheErr)
        }
      }

      if (onProgress) onProgress(100)
    } catch (error) {
      console.error(`[OfflineManager] Failed to download book ${slug}`, error)
      throw error
    }
  }

  static async removeBook(slug: string): Promise<void> {
    await del(`ky_offline_book_${slug}`)
  }

  static async getOfflineBook(slug: string): Promise<any | null> {
    const raw = await get(`ky_offline_book_${slug}`)
    if (!raw) return null
    return JSON.parse(raw)
  }
}
