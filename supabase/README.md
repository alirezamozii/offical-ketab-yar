# 🗄️ Ketab-Yar Database Setup

## Quick Setup (Manual - Recommended)

### Option 1: Single File Setup (EASIEST)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/gnbaujtogmgrrwxrqsfj
2. **Click "SQL Editor"** (left sidebar)
3. **Click "New Query"**
4. **Copy & paste** the entire content of `COMPLETE_SETUP.sql`
5. **Click "Run"** (or press Ctrl+Enter)
6. **Done!** ✅

### Option 2: Individual Migration Files

Run each file in order:
1. `20250101_000000_enable_extensions.sql`
2. `20250101_000001_core_tables.sql`
3. `20250101_000002_user_interaction_tables.sql`
4. `20250101_000003_gamification_tables.sql`
5. `20250101_000004_payment_and_admin_tables.sql`
6. `20250101_000005_offline_sync_tables.sql`
7. `20250101_000006_functions_and_triggers.sql`
8. `20250101_000007_row_level_security.sql`

---

## Verify Setup

Run this in your terminal:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://gnbaujtogmgrrwxrqsfj.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
npx tsx scripts/verify-complete-setup.ts
```

---

## Database Architecture

### Tables Created (17 total):

**Core Tables:**
- `profiles` - User profiles with gamification
- `authors` - Book authors
- `categories` - Book categories
- `books` - Book metadata (synced from Sanity)

**User Interaction:**
- `user_library` - Reading progress
- `vocabulary` - Saved words with spaced repetition
- `bookmarks` - User bookmarks
- `highlights` - Text highlights with notes
- `reviews` - Book reviews and ratings
- `liked_books` - Favorite books

**Gamification:**
- `achievements` - Achievement definitions
- `user_achievements` - User earned achievements
- `reading_sessions` - Analytics data

**Payment & Admin:**
- `payment_sessions` - Zarinpal payment tracking
- `gemini_api_keys` - AI API key rotation

**Offline/PWA:**
- `sync_queue` - Offline operations queue
- `offline_content_cache` - Downloaded books tracking

---

## Features Included

✅ **Row Level Security (RLS)** - All tables secured
✅ **Automatic Triggers** - Auto-update timestamps, ratings, streaks
✅ **Indexes** - Optimized for performance
✅ **Seed Data** - 9 default achievements
✅ **PWA Support** - Offline-first architecture
✅ **Gamification** - XP, streaks, achievements

---

## Architecture Summary

```
📚 Books: Sanity CMS (primary) → Supabase (cache)
👤 Users: Supabase (profiles, progress, vocabulary)
💾 Offline: IndexedDB (encrypted content + sync queue)
🔄 Sync: Automatic background sync when online
🔐 Security: RLS policies on all tables
```

---

## Next Steps

1. ✅ Database is ready
2. 📚 Add books via Sanity CMS
3. 🔄 Books will auto-cache in Supabase
4. 📱 PWA will handle offline mode
5. 🚀 Start building features!
