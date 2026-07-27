# Zustand Store Architecture & State Management

This directory contains client-side state stores built with [Zustand](https://github.com/pmndrs/zustand).

## State Stores Overview

| Store | File | Description | Persisted Key |
|---|---|---|---|
| **Reader Settings** | `reader-settings-store.ts` | Font size, theme mode, bilingual layout preferences, line height | `ky_reader_settings` |
| **Reader Bookmarks** | `reader-bookmarks-store.ts` | Bookmarks, highlights, notes, current page positions | `ky_bookmarks_v1` |
| **Vocabulary Store** | `vocab-store.ts` | Saved vocabulary words, review status, Leitner/SRS progress | `ky_vocab_v1` |
| **UI Store** | `ui-store.ts` | Modal visibility, drawer state, reader controls toggle | In-memory |
| **Onboarding Store** | `onboarding-store.ts` | First-time user onboarding progress, level selection | `ky_onboarding` |

## Persistence Layer

Stores that require persistent storage utilize indexedDB / localStorage wrapper (`src/lib/store/storage.ts`).
For server synchronization of collections, goals, reading history, and achievements, background sync calls are dispatched to `/api/*/sync`.
