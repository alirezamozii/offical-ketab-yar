-- ============================================
-- KETAB-YAR: PAYMENT & ADMIN TABLES
-- ============================================
-- Payment tracking and admin utilities
-- Date: 2025-01-01
-- ============================================

-- ============================================
-- 1. PAYMENT_SESSIONS (Zarinpal)
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Zarinpal Data
  authority TEXT NOT NULL UNIQUE,
  plan_id TEXT NOT NULL, -- 'monthly', 'quarterly', 'annual'
  amount INTEGER NOT NULL, -- In Rials
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  ref_id TEXT, -- Zarinpal reference ID after verification
  
  -- Timestamps
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. GEMINI_API_KEYS (For AI chat rotation)
-- ============================================
CREATE TABLE IF NOT EXISTS public.gemini_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_name TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Payment Sessions
CREATE INDEX IF NOT EXISTS idx_payment_sessions_user_id ON public.payment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_authority ON public.payment_sessions(authority);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_status ON public.payment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_created_at ON public.payment_sessions(created_at DESC);

-- Gemini API Keys
CREATE INDEX IF NOT EXISTS idx_gemini_api_keys_active ON public.gemini_api_keys(is_active) WHERE is_active = TRUE;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.payment_sessions IS 'Zarinpal payment tracking';
COMMENT ON TABLE public.gemini_api_keys IS 'AI API keys management for rotation';
