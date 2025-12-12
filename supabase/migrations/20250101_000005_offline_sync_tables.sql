-- ============================================
-- KETAB-YAR: OFFLINE SYNC TABLES
-- ============================================
-- PWA offline-first architecture support (Agent 2)
-- Date: 2025-01-01
-- ============================================

-- ============================================
-- 1. SYNC_QUEUE (For offline operations)
-- ============================================
CREATE TABLE IF NOT EXISTS public.sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Operation Details
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id UUID NOT NULL,
  data JSONB NOT NULL,
  
  -- Sync Status
  synced BOOLEAN DEFAULT FALSE,
  sync_attempts INTEGER DEFAULT 0,
  last_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

-- ============================================
-- 2. OFFLINE_CONTENT_CACHE (For downloaded books)
-- ============================================
CREATE TABLE IF NOT EXISTS public.offline_content_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  
  -- Cache Details
  content_hash TEXT NOT NULL, -- SHA-256 hash for integrity check
  encrypted BOOLEAN DEFAULT TRUE,
  size_bytes INTEGER,
  
  -- Timestamps
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For premium users, set expiry based on subscription
  
  UNIQUE(user_id, book_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Sync Queue
CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id ON public.sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON public.sync_queue(synced) WHERE synced = FALSE;
CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON public.sync_queue(created_at DESC);

-- Offline Content Cache
CREATE INDEX IF NOT EXISTS idx_offline_cache_user_id ON public.offline_content_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_cache_expires_at ON public.offline_content_cache(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.sync_queue IS 'Offline operations queue for PWA sync - stores operations made while offline';
COMMENT ON TABLE public.offline_content_cache IS 'Tracks downloaded books for offline reading - actual content stored in IndexedDB';
COMMENT ON COLUMN public.offline_content_cache.content_hash IS 'SHA-256 hash for verifying content integrity';
COMMENT ON COLUMN public.offline_content_cache.encrypted IS 'Whether content is encrypted in IndexedDB (should always be true)';
