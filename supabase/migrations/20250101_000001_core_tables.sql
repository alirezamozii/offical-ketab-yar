-- ============================================
-- KETAB-YAR: CORE TABLES
-- ============================================
-- User profiles and core data structures
-- Date: 2025-01-01
-- ============================================

-- ============================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  
  -- Learning Preferences
  level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  language_preference TEXT DEFAULT 'en',
  
  -- Gamification (Agent 3)
  xp INTEGER DEFAULT 0 CHECK (xp >= 0),
  current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
  last_read_at DATE,
  
  -- Subscription (Freemium Model)
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'monthly', 'quarterly', 'annual')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired')),
  subscription_started_at TIMESTAMPTZ,
  subscription_expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Admin & Moderation
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'test_user')),
  is_banned BOOLEAN DEFAULT FALSE,
  banned_at TIMESTAMPTZ,
  banned_reason TEXT,
  made_admin_by UUID REFERENCES public.profiles(id),
  made_admin_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. AUTHORS TABLE (Optional - for future use)
-- ============================================
CREATE TABLE IF NOT EXISTS public.authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CATEGORIES TABLE (Synced from Sanity)
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. BOOKS TABLE (Metadata synced from Sanity)
-- ============================================
-- NOTE: This is a CACHE table. Primary source is Sanity CMS.
-- Used for quick queries and offline support.
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sanity_id TEXT UNIQUE NOT NULL, -- Reference to Sanity document
  
  -- Basic Info
  title TEXT NOT NULL,
  subtitle TEXT,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Author & Category
  author TEXT NOT NULL,
  author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  genres TEXT[] DEFAULT '{}',
  
  -- Book Details
  publication_year INTEGER,
  isbn TEXT,
  publisher TEXT,
  language TEXT DEFAULT 'en',
  level TEXT DEFAULT 'intermediate' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  total_pages INTEGER DEFAULT 0,
  
  -- Media
  cover_url TEXT,
  
  -- Freemium Model
  is_premium BOOLEAN DEFAULT TRUE,
  free_preview_pages INTEGER DEFAULT 20,
  
  -- Publishing
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured BOOLEAN DEFAULT FALSE,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  
  -- Sync tracking
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON public.profiles(subscription_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON public.profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role) WHERE role = 'admin';
CREATE INDEX IF NOT EXISTS idx_profiles_last_read ON public.profiles(last_read_at DESC) WHERE last_read_at IS NOT NULL;

-- Books
CREATE INDEX IF NOT EXISTS idx_books_sanity_id ON public.books(sanity_id);
CREATE INDEX IF NOT EXISTS idx_books_slug ON public.books(slug);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_books_featured ON public.books(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_books_author_id ON public.books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_category_id ON public.books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_rating ON public.books(rating DESC);
CREATE INDEX IF NOT EXISTS idx_books_genres ON public.books USING GIN(genres);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.profiles IS 'User profiles with gamification and subscription data';
COMMENT ON TABLE public.books IS 'Book metadata cache synced from Sanity CMS - Primary source is Sanity';
COMMENT ON COLUMN public.books.sanity_id IS 'Reference to Sanity CMS document ID';
COMMENT ON COLUMN public.profiles.xp IS 'Total experience points earned';
COMMENT ON COLUMN public.profiles.current_streak IS 'Current consecutive days reading';
