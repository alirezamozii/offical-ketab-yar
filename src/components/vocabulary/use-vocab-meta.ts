'use client'

/**
 * Vocab meta storage helpers — client-side metadata layered on top of the
 * server vocabulary records (which only hold word/definition/translation/
 * context/bookSlug). Anything user-defined that the schema doesn't model
 * (categories, difficulty level, synonyms, antonyms) lives here in
 * localStorage so it survives reloads and syncs across tabs.
 *
 * Why localStorage and not the server? The existing vocabulary API is
 * intentionally minimal (it has no PATCH route and no schema columns for
 * these fields). Storing meta client-side lets us add these UX features
 * without a DB migration. If a future schema adds the columns, this
 * module is the only place to swap out.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '@/lib/storage-keys'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DifficultyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface VocabCategory {
  id: string
  label: string
  /** Optional source-book slug for auto categories like "از کتاب آلیس". */
  bookSlug?: string
  /** Built-in marker — these can't be deleted from the UI. */
  system?: boolean
  color?: 'amber' | 'gold' | 'emerald' | 'rose' | 'sky'
  createdAt: number
}

export interface VocabWordMeta {
  /** CEFR-style difficulty level. */
  difficulty?: DifficultyLevel
  /** User-added synonyms (English). */
  synonyms?: string[]
  /** User-added antonyms (English). */
  antonyms?: string[]
  /** Category ids this word belongs to. */
  categoryIds?: string[]
  /** Example sentence (overrides the book-derived `context` if set). */
  example?: string
  /** Free-form notes the user typed. */
  notes?: string
}

export interface VocabCategoriesStore {
  categories: VocabCategory[]
  /** Per-word meta keyed by wordId. */
  meta: Record<string, VocabWordMeta>
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const CAT_KEY = STORAGE_KEYS.vocabCategories
const CAT_EVENT = 'ky_vocab_categories:change'

const EMPTY: VocabCategoriesStore = { categories: [], meta: {} }

function read(): VocabCategoriesStore {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = localStorage.getItem(CAT_KEY)
    if (!raw) return EMPTY
    const v = JSON.parse(raw)
    if (!v || typeof v !== 'object') return EMPTY
    return {
      categories: Array.isArray(v.categories) ? v.categories : [],
      meta: v.meta && typeof v.meta === 'object' ? v.meta : {},
    }
  } catch {
    return EMPTY
  }
}

function write(store: VocabCategoriesStore) {
  try {
    localStorage.setItem(CAT_KEY, JSON.stringify(store))
    window.dispatchEvent(new CustomEvent(CAT_EVENT))
  } catch {}
}

// ---------------------------------------------------------------------------
// System categories — auto-derived from word.bookSlug. These appear
// automatically when a word from a book is saved, and can't be deleted.
// ---------------------------------------------------------------------------

const SYSTEM_BOOK_PREFIX = 'book:'

function systemBookCategory(bookSlug: string, label: string): VocabCategory {
  return {
    id: `${SYSTEM_BOOK_PREFIX}${bookSlug}`,
    label: `از کتاب ${label}`,
    bookSlug,
    system: true,
    color: 'gold',
    createdAt: 0,
  }
}

const SYSTEM_HARD: VocabCategory = {
  id: 'system:hard',
  label: 'سخت',
  system: true,
  color: 'rose',
  createdAt: 0,
}

const SYSTEM_FAVORITE: VocabCategory = {
  id: 'system:favorite',
  label: 'علاقه‌مند',
  system: true,
  color: 'amber',
  createdAt: 0,
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseVocabMetaReturn {
  store: VocabCategoriesStore
  /** All categories, including system ones auto-derived from book slugs. */
  allCategories: VocabCategory[]
  /** System categories that should always be visible (hard/favorite). */
  systemCategories: VocabCategory[]
  /** User-defined categories (excludes system ones). */
  userCategories: VocabCategory[]
  /** Get meta for a single word (always returns an object). */
  getMeta: (wordId: string) => VocabWordMeta
  /** Get the full VocabCategory list a word belongs to. */
  categoriesFor: (wordId: string) => VocabCategory[]
  /** Update meta for a word (merges shallowly). */
  setMeta: (wordId: string, patch: Partial<VocabWordMeta>) => void
  /** Add a word to a category (idempotent). */
  addToCategory: (wordId: string, categoryId: string) => void
  /** Remove a word from a category. */
  removeFromCategory: (wordId: string, categoryId: string) => void
  /** Toggle a word's membership in a category. */
  toggleCategory: (wordId: string, categoryId: string) => void
  /** Create a new user-defined category. Returns its id. */
  createCategory: (label: string, color?: VocabCategory['color']) => string
  /** Delete a user-defined category (system ones are protected). */
  deleteCategory: (categoryId: string) => void
  /** Get ids of words belonging to a category. */
  wordIdsInCategory: (categoryId: string, allWordIds: string[]) => string[]
  /** Ensure a system "book:<slug>" category exists for a given book title. */
  ensureBookCategory: (bookSlug: string, bookTitle: string) => void
}

export function useVocabMeta(
  /**
   * Pass the list of currently-loaded words so the hook can auto-derive
   * system "from book <title>" categories. If undefined, only user +
   * permanent system categories are returned.
   */
  words?: Array<{ id: string; bookSlug?: string }>,
): UseVocabMetaReturn {
  const [store, setStore] = useState<VocabCategoriesStore>(EMPTY)

  useEffect(() => {
    setStore(read())
    const handler = () => setStore(read())
    window.addEventListener(CAT_EVENT, handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener(CAT_EVENT, handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  // Auto-derive "from book X" system categories from loaded words.
  const bookCategories: VocabCategory[] = useMemo(() => {
    if (!words || words.length === 0) return []
    const seenSlugs = new Set<string>()
    const cats: VocabCategory[] = []
    for (const w of words) {
      const slug = w.bookSlug
      if (!slug || seenSlugs.has(slug)) continue
      seenSlugs.add(slug)
      cats.push(systemBookCategory(slug, slug))
    }
    return cats
  }, [words])

  const userCategories = useMemo(
    () => store.categories.filter((c) => !c.system),
    [store.categories],
  )
  const systemCategories = useMemo(
    () => [SYSTEM_FAVORITE, SYSTEM_HARD, ...bookCategories],
    [bookCategories],
  )
  const existingBookCatIds = useMemo(
    () =>
      new Set(
        store.categories
          .filter((c) => c.system && c.id.startsWith(SYSTEM_BOOK_PREFIX))
          .map((c) => c.id),
      ),
    [store.categories],
  )
  // Merge: prefer user-saved book category titles, but always show a row
  // for every book slug present in `words`.
  const filteredCategories = useMemo(
    () =>
      store.categories.filter(
        (c) =>
          !c.system ||
          (!existingBookCatIds.has(c.id) &&
            !bookCategories.some((bc) => bc.id === c.id)),
      ),
    [store.categories, bookCategories, existingBookCatIds],
  )
  const allCategories: VocabCategory[] = useMemo(
    () => [...systemCategories, ...filteredCategories],
    [systemCategories, filteredCategories],
  )

  const getMeta = useCallback(
    (wordId: string): VocabWordMeta => store.meta[wordId] ?? {},
    [store.meta],
  )

  const categoriesFor = useCallback(
    (wordId: string): VocabCategory[] => {
      const meta = store.meta[wordId]
      const ids = new Set(meta?.categoryIds ?? [])
      return allCategories.filter((c) => ids.has(c.id))
    },
    [store.meta, allCategories],
  )

  const setMeta = useCallback(
    (wordId: string, patch: Partial<VocabWordMeta>) => {
      setStore((prev) => {
        const cur = prev.meta[wordId] ?? {}
        const next: VocabWordMeta = { ...cur, ...patch }
        // Drop empty arrays to keep storage lean.
        if (next.synonyms && next.synonyms.length === 0) delete next.synonyms
        if (next.antonyms && next.antonyms.length === 0) delete next.antonyms
        if (next.categoryIds && next.categoryIds.length === 0)
          delete next.categoryIds
        if (next.example === '') delete next.example
        if (next.notes === '') delete next.notes
        const out: VocabCategoriesStore = {
          ...prev,
          meta: { ...prev.meta, [wordId]: next },
        }
        write(out)
        return out
      })
    },
    [],
  )

  const addToCategory = useCallback(
    (wordId: string, categoryId: string) => {
      setStore((prev) => {
        const cur = prev.meta[wordId] ?? {}
        const ids = new Set(cur.categoryIds ?? [])
        ids.add(categoryId)
        const out: VocabCategoriesStore = {
          ...prev,
          meta: {
            ...prev.meta,
            [wordId]: { ...cur, categoryIds: [...ids] },
          },
        }
        write(out)
        return out
      })
    },
    [],
  )

  const removeFromCategory = useCallback(
    (wordId: string, categoryId: string) => {
      setStore((prev) => {
        const cur = prev.meta[wordId] ?? {}
        const ids = (cur.categoryIds ?? []).filter((id) => id !== categoryId)
        const nextMeta: VocabWordMeta = { ...cur }
        if (ids.length > 0) nextMeta.categoryIds = ids
        else delete nextMeta.categoryIds
        const out: VocabCategoriesStore = {
          ...prev,
          meta: { ...prev.meta, [wordId]: nextMeta },
        }
        write(out)
        return out
      })
    },
    [],
  )

  const toggleCategory = useCallback(
    (wordId: string, categoryId: string) => {
      const cur = store.meta[wordId] ?? {}
      const ids = cur.categoryIds ?? []
      if (ids.includes(categoryId)) {
        removeFromCategory(wordId, categoryId)
      } else {
        addToCategory(wordId, categoryId)
      }
    },
    [store.meta, addToCategory, removeFromCategory],
  )

  const createCategory = useCallback(
    (label: string, color: VocabCategory['color'] = 'amber'): string => {
      const id = `user:${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 6)}`
      setStore((prev) => {
        const cat: VocabCategory = {
          id,
          label: label.trim() || 'بدون نام',
          color,
          createdAt: Date.now(),
        }
        const out: VocabCategoriesStore = {
          ...prev,
          categories: [...prev.categories, cat],
        }
        write(out)
        return out
      })
      return id
    },
    [],
  )

  const deleteCategory = useCallback((categoryId: string) => {
    setStore((prev) => {
      const cat = prev.categories.find((c) => c.id === categoryId)
      if (!cat || cat.system) return prev // protect system categories
      const out: VocabCategoriesStore = {
        categories: prev.categories.filter((c) => c.id !== categoryId),
        meta: Object.fromEntries(
          Object.entries(prev.meta).map(([wid, m]) => [
            wid,
            {
              ...m,
              categoryIds: (m.categoryIds ?? []).filter(
                (id) => id !== categoryId,
              ),
            },
          ]),
        ),
      }
      write(out)
      return out
    })
  }, [])

  const wordIdsInCategory = useCallback(
    (categoryId: string, allWordIds: string[]): string[] => {
      return allWordIds.filter((wid) => {
        const m = store.meta[wid]
        return m?.categoryIds?.includes(categoryId) ?? false
      })
    },
    [store.meta],
  )

  const ensureBookCategory = useCallback(
    (bookSlug: string, bookTitle: string) => {
      const id = `${SYSTEM_BOOK_PREFIX}${bookSlug}`
      setStore((prev) => {
        const existing = prev.categories.find((c) => c.id === id)
        if (existing && existing.label === `از کتاب ${bookTitle}`) return prev
        const cat: VocabCategory = {
          id,
          label: `از کتاب ${bookTitle}`,
          bookSlug,
          system: true,
          color: 'gold',
          createdAt: existing?.createdAt ?? Date.now(),
        }
        const out: VocabCategoriesStore = {
          ...prev,
          categories: [
            ...prev.categories.filter((c) => c.id !== id),
            cat,
          ],
        }
        write(out)
        return out
      })
    },
    [],
  )

  return {
    store,
    allCategories,
    systemCategories,
    userCategories,
    getMeta,
    categoriesFor,
    setMeta,
    addToCategory,
    removeFromCategory,
    toggleCategory,
    createCategory,
    deleteCategory,
    wordIdsInCategory,
    ensureBookCategory,
  }
}

// ---------------------------------------------------------------------------
// Difficulty helpers
// ---------------------------------------------------------------------------

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  'A1',
  'A2',
  'B1',
  'B2',
  'C1',
  'C2',
]

export function difficultyLabel(level: DifficultyLevel): string {
  switch (level) {
    case 'A1':
      return 'مقدماتی (A1)'
    case 'A2':
      return 'پایه (A2)'
    case 'B1':
      return 'متوسط (B1)'
    case 'B2':
      return 'متوسط بالا (B2)'
    case 'C1':
      return 'پیشرفته (C1)'
    case 'C2':
      return 'تسلط (C2)'
  }
}

/** Tailwind text color for a difficulty badge. */
export function difficultyColor(level: DifficultyLevel): string {
  switch (level) {
    case 'A1':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
    case 'A2':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
    case 'B1':
      return 'bg-gold-500/15 text-gold-700 dark:text-gold-300'
    case 'B2':
      return 'bg-gold-500/15 text-gold-700 dark:text-gold-300'
    case 'C1':
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
    case 'C2':
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
  }
}

/** Color for a VocabCategory chip. */
export function categoryColorClass(color?: VocabCategory['color']): string {
  switch (color) {
    case 'amber':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
    case 'gold':
      return 'bg-gold-500/15 text-gold-700 dark:text-gold-300'
    case 'emerald':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
    case 'rose':
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
    // 'sky' identifier kept for backwards-compat with stored category data;
    // visual migrated to teal (warm-adjacent hue, already used in top-trending)
    // per audit 02 P0 #6 — gold would duplicate the existing 'gold' case.
    case 'sky':
      return 'bg-teal-500/15 text-teal-700 dark:text-teal-300'
    default:
      return 'bg-muted text-muted-foreground'
  }
}
