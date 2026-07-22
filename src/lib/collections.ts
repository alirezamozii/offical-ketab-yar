/**
 * src/lib/collections.ts
 * ---------------------------------------------------------------
 * Pure helpers + types for the user's book collections
 * ("bookshelves"). Collections live entirely in localStorage
 * (key: `ky_collections`); the API route at `/api/collections`
 * only validates and documents the schema — it does not persist
 * anything (collections are guest-scoped, browser-only).
 *
 * A `Collection` is a labeled bucket of book slugs. The user gets
 * four default collections out of the box (Favorites, To Read
 * Later, Currently Reading, Completed), and can create as many
 * custom collections as they want.
 *
 * Color discipline: gold / amber / emerald / rose / stone / teal
 * only. NO indigo / blue per project rule.
 *
 * Icon discipline: a small curated subset of lucide-react icon
 * names (stored as strings so the catalog can be SSR'd without
 * importing the icon components).
 *
 * NOTE: This file is intentionally a plain `.ts` module with NO
 * `'use client'` directive and NO React imports. The constants
 * (DEFAULT_COLLECTIONS, COLLECTION_COLORS, etc.) and pure helpers
 * (readCollections, createCollection, ...) are universal — they're
 * imported by the API route at `/api/collections` (a server
 * component) and by client components alike. The React parts
 * (the `useCollections` hook + `<CollectionIcon>` component) live
 * in `src/lib/collections-client.tsx` (marked `'use client'`) to
 * keep this module SSR-safe.
 * ---------------------------------------------------------------
 */

import {
  Bookmark,
  BookOpen,
  CheckCircle,
  Clock,
  Flame,
  Heart,
  Star,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { STORAGE_KEYS } from '@/lib/storage-keys'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CollectionColor =
  | 'gold'
  | 'amber'
  | 'emerald'
  | 'rose'
  | 'stone'
  | 'teal'

export type CollectionIconName =
  | 'Heart'
  | 'Bookmark'
  | 'BookOpen'
  | 'Clock'
  | 'CheckCircle'
  | 'Star'
  | 'Flame'
  | 'Trophy'

export interface Collection {
  id: string
  name: string
  description: string
  /** Slugs of books in this collection. Order = insertion order. */
  bookSlugs: string[]
  color: CollectionColor
  icon: CollectionIconName
  /** ISO timestamp — when the collection was first created. */
  createdAt: string
  /** ISO timestamp — updated whenever a book is added/removed or metadata edited. */
  updatedAt: string
  /** `true` for the four seeded default collections — they can be emptied but not renamed or deleted. */
  isDefault?: boolean
}

// ---------------------------------------------------------------------------
// Color catalog — single source of truth for collection color tokens.
// Each entry has a tailwind gradient (for the card header / icon tile) and a
// "soft" bg-fg-text trio used by chips + buttons.
// ---------------------------------------------------------------------------

export interface ColorTokens {
  /** Tailwind gradient utility for header bars + icon tiles. */
  gradient: string
  /** Soft background tint for chips / detail accents. */
  soft: string
  /** Foreground text color (dark-mode-safe) for chips. */
  text: string
  /** Border tint (used for hover rings on cards). */
  border: string
  /** Solid pill background (used for the "X کتاب" badge). */
  pill: string
  /** Dot color used in the color picker swatch (solid bg). */
  swatch: string
  /** Persian label for the color (color picker tooltip / aria-label). */
  label: string
}

export const COLLECTION_COLORS: Record<CollectionColor, ColorTokens> = {
  gold: {
    gradient: 'from-gold-500 to-gold-700',
    soft: 'bg-gold-500/10',
    text: 'text-gold-800 dark:text-gold-300',
    border: 'hover:border-gold-500/50',
    pill: 'bg-gold-500/15 text-gold-800 dark:text-gold-300',
    swatch: 'bg-gradient-to-br from-gold-400 to-gold-600',
    label: 'طلایی',
  },
  amber: {
    gradient: 'from-amber-400 to-amber-600',
    soft: 'bg-amber-500/10',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'hover:border-amber-500/50',
    pill: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
    swatch: 'bg-gradient-to-br from-amber-300 to-amber-500',
    label: 'کهربایی',
  },
  emerald: {
    gradient: 'from-emerald-500 to-emerald-700',
    soft: 'bg-emerald-500/10',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'hover:border-emerald-500/50',
    pill: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
    swatch: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    label: 'سبز زمردی',
  },
  rose: {
    gradient: 'from-rose-500 to-rose-700',
    soft: 'bg-rose-500/10',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'hover:border-rose-500/50',
    pill: 'bg-rose-500/15 text-rose-800 dark:text-rose-300',
    swatch: 'bg-gradient-to-br from-rose-400 to-rose-600',
    label: 'گلبهی',
  },
  stone: {
    gradient: 'from-stone-500 to-stone-700',
    soft: 'bg-stone-500/10',
    text: 'text-stone-800 dark:text-stone-300',
    border: 'hover:border-stone-500/50',
    pill: 'bg-stone-500/15 text-stone-800 dark:text-stone-300',
    swatch: 'bg-gradient-to-br from-stone-400 to-stone-600',
    label: 'سنگی',
  },
  teal: {
    gradient: 'from-teal-500 to-teal-700',
    soft: 'bg-teal-500/10',
    text: 'text-teal-800 dark:text-teal-300',
    border: 'hover:border-teal-500/50',
    pill: 'bg-teal-500/15 text-teal-800 dark:text-teal-300',
    swatch: 'bg-gradient-to-br from-teal-400 to-teal-600',
    label: 'فیروزه‌ای',
  },
}

export const COLLECTION_COLOR_LIST: CollectionColor[] = [
  'gold',
  'amber',
  'emerald',
  'rose',
  'stone',
  'teal',
]

// ---------------------------------------------------------------------------
// Icon catalog — string-keyed so collections can be serialized. The icon
// component is resolved at render time via `getCollectionIcon(name)`.
// ---------------------------------------------------------------------------

export const COLLECTION_ICON_LIST: CollectionIconName[] = [
  'Heart',
  'Bookmark',
  'BookOpen',
  'Clock',
  'CheckCircle',
  'Star',
  'Flame',
  'Trophy',
]

const ICON_MAP: Record<CollectionIconName, LucideIcon> = {
  Heart,
  Bookmark,
  BookOpen,
  Clock,
  CheckCircle,
  Star,
  Flame,
  Trophy,
}

export { ICON_MAP }

export function getCollectionIcon(name: CollectionIconName): LucideIcon {
  return ICON_MAP[name] ?? Bookmark
}

export const COLLECTION_ICON_LABELS: Record<CollectionIconName, string> = {
  Heart: 'قلب',
  Bookmark: 'نشانک',
  BookOpen: 'کتاب باز',
  Clock: 'ساعت',
  CheckCircle: 'تکمیل',
  Star: 'ستاره',
  Flame: 'شعله',
  Trophy: 'جام',
}

// ---------------------------------------------------------------------------
// Default collections — seeded on first run. They are *not* deletable.
// ---------------------------------------------------------------------------

const NOW = () => new Date().toISOString()

export const DEFAULT_COLLECTIONS: Collection[] = [
  {
    id: 'default-favorites',
    name: 'علاقه‌مندی‌ها',
    description: 'کتاب‌هایی که دوست دارید بعداً دوباره بخوانید.',
    bookSlugs: [],
    color: 'rose',
    icon: 'Heart',
    createdAt: NOW(),
    updatedAt: NOW(),
    isDefault: true,
  },
  {
    id: 'default-to-read',
    name: 'بعداً می‌خوانم',
    description: 'فهرست کتاب‌هایی که قصد خواندنشان را دارید.',
    bookSlugs: [],
    color: 'gold',
    icon: 'Bookmark',
    createdAt: NOW(),
    updatedAt: NOW(),
    isDefault: true,
  },
  {
    id: 'default-reading',
    name: 'در حال مطالعه',
    description: 'کتاب‌هایی که الان در حال خواندن آن‌ها هستید.',
    bookSlugs: [],
    color: 'teal',
    icon: 'BookOpen',
    createdAt: NOW(),
    updatedAt: NOW(),
    isDefault: true,
  },
  {
    id: 'default-completed',
    name: 'تکمیل شده',
    description: 'کتاب‌هایی که تا انتها خوانده‌اید.',
    bookSlugs: [],
    color: 'emerald',
    icon: 'CheckCircle',
    createdAt: NOW(),
    updatedAt: NOW(),
    isDefault: true,
  },
]

// ---------------------------------------------------------------------------
// Low-level localStorage I/O — pure functions, safe to call from any client
// context. Reads never throw; corrupt JSON yields the default catalog.
// ---------------------------------------------------------------------------

const KEY = STORAGE_KEYS.collections

function isValidCollection(x: unknown): x is Collection {
  if (!x || typeof x !== 'object') return false
  const c = x as Record<string, unknown>
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.description === 'string' &&
    Array.isArray(c.bookSlugs) &&
    typeof c.color === 'string' &&
    typeof c.icon === 'string' &&
    typeof c.createdAt === 'string' &&
    typeof c.updatedAt === 'string'
  )
}

function normalize(input: unknown): Collection[] {
  if (!Array.isArray(input)) return seedDefaults()
  const valid = input.filter(isValidCollection) as Collection[]
  if (valid.length === 0) return seedDefaults()
  // Ensure every default collection exists even if the user nuked some.
  const haveIds = new Set(valid.map((c) => c.id))
  const missing = DEFAULT_COLLECTIONS.filter((d) => !haveIds.has(d.id))
  return [...missing, ...valid]
}

function seedDefaults(): Collection[] {
  // Return fresh copies so the caller can mutate without touching the
  // canonical DEFAULT_COLLECTIONS array.
  return DEFAULT_COLLECTIONS.map((c) => ({ ...c, bookSlugs: [] }))
}

export function readCollections(): Collection[] {
  if (typeof window === 'undefined') return seedDefaults()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const seeded = seedDefaults()
      writeCollections(seeded)
      return seeded
    }
    return normalize(JSON.parse(raw))
  } catch {
    return seedDefaults()
  }
}

export function writeCollections(collections: Collection[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(collections))
    // Broadcast to same-tab listeners (browsers don't fire `storage` for
    // the originating tab; we bridge via a synthetic event).
    window.dispatchEvent(
      new CustomEvent('ky:storage', {
        detail: { key: KEY, value: collections },
      }),
    )
  } catch {
    /* ignore quota / private-mode errors */
  }
}

// ---------------------------------------------------------------------------
// Pure helpers — mutate the catalog and persist. Each returns the updated
// catalog so callers can `setState` directly.
// ---------------------------------------------------------------------------

function genId(): string {
  return `col-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createCollection(
  name: string,
  description: string,
  color: CollectionColor,
  icon: CollectionIconName,
): Collection {
  const trimmedName = name.trim()
  if (!trimmedName) {
    throw new Error('نام پلی‌لیست نمی‌تواند خالی باشد.')
  }
  const now = NOW()
  const collection: Collection = {
    id: genId(),
    name: trimmedName,
    description: description.trim(),
    bookSlugs: [],
    color,
    icon,
    createdAt: now,
    updatedAt: now,
  }
  const all = readCollections()
  const next = [...all, collection]
  writeCollections(next)
  return collection
}

export function deleteCollection(id: string): void {
  const all = readCollections()
  const target = all.find((c) => c.id === id)
  // Default collections cannot be deleted — silently no-op.
  if (!target || target.isDefault) return
  writeCollections(all.filter((c) => c.id !== id))
}

export function addBookToCollection(id: string, slug: string): void {
  const all = readCollections()
  const idx = all.findIndex((c) => c.id === id)
  if (idx < 0) return
  const col = all[idx]
  if (col.bookSlugs.includes(slug)) return
  const updated: Collection = {
    ...col,
    bookSlugs: [...col.bookSlugs, slug],
    updatedAt: NOW(),
  }
  all[idx] = updated
  writeCollections(all)
}

export function removeBookFromCollection(id: string, slug: string): void {
  const all = readCollections()
  const idx = all.findIndex((c) => c.id === id)
  if (idx < 0) return
  const col = all[idx]
  if (!col.bookSlugs.includes(slug)) return
  const updated: Collection = {
    ...col,
    bookSlugs: col.bookSlugs.filter((s) => s !== slug),
    updatedAt: NOW(),
  }
  all[idx] = updated
  writeCollections(all)
}

export function isBookInCollection(id: string, slug: string): boolean {
  const all = readCollections()
  const col = all.find((c) => c.id === id)
  return Boolean(col?.bookSlugs.includes(slug))
}

/** Returns every collection that contains the given book slug. */
export function getBookCollections(slug: string): Collection[] {
  return readCollections().filter((c) => c.bookSlugs.includes(slug))
}

export function getCollectionById(id: string): Collection | undefined {
  return readCollections().find((c) => c.id === id)
}

export function renameCollection(
  id: string,
  name: string,
  description?: string,
): void {
  const all = readCollections()
  const idx = all.findIndex((c) => c.id === id)
  if (idx < 0) return
  const col = all[idx]
  if (col.isDefault) return // defaults are not renameable
  const updated: Collection = {
    ...col,
    name: name.trim() || col.name,
    description: description !== undefined ? description.trim() : col.description,
    updatedAt: NOW(),
  }
  all[idx] = updated
  writeCollections(all)
}

/** Internal: the localStorage key (used by the client hook for storage sync). */
export const COLLECTIONS_STORAGE_KEY = KEY

/** Internal: re-export seedDefaults so the client hook can render defaults
 *  on SSR / first paint before localStorage hydrates. */
export function _seedDefaults(): Collection[] {
  return seedDefaults()
}
