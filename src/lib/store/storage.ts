import { get, set, del } from 'idb-keyval'
import { StateStorage } from 'zustand/middleware'

/**
 * Custom storage for Zustand that uses IndexedDB via idb-keyval.
 * This bypasses the 5MB size limit of standard localStorage and is
 * essential for storing large data like downloaded books and images
 * offline, enabling a true local-first architecture.
 */
export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get(name)
    return value ?? null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  },
}
