-- ============================================
-- KETAB-YAR: USER INTERACTION TABLES
-- ============================================
-- Tables for user reading progress, vocabulary, bookmarks, etc.
-- Date: 2025-01-01
-- ============================================

-- ============================================
-- 1. USER_LIBRARY (Reading Progress)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  
  -- Reading Status
  status TEXT DEFAULT 'want_to_read' CHECK (status IN ('want_to_read', 'reading', 'completed')),
  current_page INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- Stats
  reading_time INTEGER DEFAULT 0, -- Total minutes
  xp_earned INTEGER DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, book_id)
);

-- ============================================
-- 2. VOCABULARY (Saved Words with Spaced Repetition)
-- ============================================
CREATE TABLE IF NOT EXISTS public.vocabulary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Word Data
  word TEXT NOT NULL,
  definition TEXT,
  meaning TEXT, -- Persian translation
  context TEXT, -- Sentence where word appeared
  
  -- Source
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  page_number INTEGER,
  
  -- Spaced Repetition
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  status TEXT DEFAULT 'learning' CHECK (status IN ('learning', 'reviewing', 'mastered')),
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. BOOKMARKS
-- ============================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, book_id, page_number)
);

-- ============================================
-- 4. HIGHLIGHTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  text TEXT NOT NULL,
  color TEXT DEFAULT 'yellow' CHECK (color IN ('yellow', 'green', 'blue', 'pink', 'purple')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, book_id)
);

-- ============================================
-- 6. LIKED_BOOKS (Favorites)
-- ============================================
CREATE TABLE IF NOT EXISTS public.liked_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, book_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- User Library
CREATE INDEX IF NOT EXISTS idx_user_library_user_id ON public.user_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_book_id ON public.user_library(book_id);
CREATE INDEX IF NOT EXISTS idx_user_library_status ON public.user_library(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_library_last_read ON public.user_library(user_id, last_read_at DESC);

-- Vocabulary
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_id ON public.vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_word ON public.vocabulary(word);
CREATE INDEX IF NOT EXISTS idx_vocabulary_next_review ON public.vocabulary(user_id, next_review_at) WHERE status != 'mastered';
CREATE INDEX IF NOT EXISTS idx_vocabulary_status ON public.vocabulary(user_id, status);

-- Bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_book_id ON public.bookmarks(book_id);

-- Highlights
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON public.highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_book_id ON public.highlights(book_id);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON public.reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Liked Books
CREATE INDEX IF NOT EXISTS idx_liked_books_user_id ON public.liked_books(user_id);
CREATE INDEX IF NOT EXISTS idx_liked_books_book_id ON public.liked_books(book_id);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.user_library IS 'User reading progress and library management';
COMMENT ON TABLE public.vocabulary IS 'User saved words with spaced repetition data';
COMMENT ON TABLE public.bookmarks IS 'User bookmarks for quick navigation';
COMMENT ON TABLE public.highlights IS 'User text highlights with notes';
COMMENT ON TABLE public.reviews IS 'User book reviews and ratings';
COMMENT ON TABLE public.liked_books IS 'User favorite books';
