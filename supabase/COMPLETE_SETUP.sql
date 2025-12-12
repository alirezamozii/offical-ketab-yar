-- ============================================
-- KETAB-YAR: COMPLETE DATABASE SETUP
-- ============================================
-- Run this SINGLE file in Supabase Dashboard SQL Editor
-- This will set up everything: tables, functions, triggers, RLS
-- Date: 2025-01-01
-- ============================================

-- ============================================
-- STEP 1: CLEAN SLATE (Drop all existing tables)
-- ============================================

DROP TABLE IF EXISTS public.offline_content_cache CASCADE;
DROP TABLE IF EXISTS public.sync_queue CASCADE;
DROP TABLE IF EXISTS public.gemini_api_keys CASCADE;
DROP TABLE IF EXISTS public.payment_sessions CASCADE;
DROP TABLE IF EXISTS public.reading_sessions CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.liked_books CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.highlights CASCADE;
DROP TABLE IF EXISTS public.bookmarks CASCADE;
DROP TABLE IF EXISTS public.vocabulary CASCADE;
DROP TABLE IF EXISTS public.user_library CASCADE;
DROP TABLE IF EXISTS public.user_progress CASCADE;
DROP TABLE IF EXISTS public.book_content CASCADE;
DROP TABLE IF EXISTS public.books CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.authors CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================
-- STEP 2: ENABLE EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- STEP 3: CREATE ALL TABLES
-- ============================================

-- PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  language_preference TEXT DEFAULT 'en',
  xp INTEGER DEFAULT 0 CHECK (xp >= 0),
  current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
  last_read_at DATE,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'monthly', 'quarterly', 'annual')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired')),
  subscription_started_at TIMESTAMPTZ,
  subscription_expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'test_user')),
  is_banned BOOLEAN DEFAULT FALSE,
  banned_at TIMESTAMPTZ,
  banned_reason TEXT,
  made_admin_by UUID REFERENCES public.profiles(id),
  made_admin_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUTHORS TABLE
CREATE TABLE public.authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CATEGORIES TABLE
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOOKS TABLE (Cache from Sanity)
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sanity_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  author TEXT NOT NULL,
  author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  genres TEXT[] DEFAULT '{}',
  publication_year INTEGER,
  isbn TEXT,
  publisher TEXT,
  language TEXT DEFAULT 'en',
  level TEXT DEFAULT 'intermediate' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  total_pages INTEGER DEFAULT 0,
  cover_url TEXT,
  is_premium BOOLEAN DEFAULT TRUE,
  free_preview_pages INTEGER DEFAULT 20,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER_LIBRARY TABLE
CREATE TABLE public.user_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'want_to_read' CHECK (status IN ('want_to_read', 'reading', 'completed')),
  current_page INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  reading_time INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- VOCABULARY TABLE
CREATE TABLE public.vocabulary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT,
  meaning TEXT,
  context TEXT,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  page_number INTEGER,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  status TEXT DEFAULT 'learning' CHECK (status IN ('learning', 'reviewing', 'mastered')),
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOOKMARKS TABLE
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id, page_number)
);

-- HIGHLIGHTS TABLE
CREATE TABLE public.highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  text TEXT NOT NULL,
  color TEXT DEFAULT 'yellow' CHECK (color IN ('yellow', 'green', 'blue', 'pink', 'purple')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REVIEWS TABLE
CREATE TABLE public.reviews (
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

-- LIKED_BOOKS TABLE
CREATE TABLE public.liked_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- ACHIEVEMENTS TABLE
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT,
  points INTEGER DEFAULT 0,
  requirement_type TEXT CHECK (requirement_type IN ('books_read', 'pages_read', 'streak_days', 'words_saved', 'xp_earned')),
  requirement_value INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER_ACHIEVEMENTS TABLE
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- READING_SESSIONS TABLE
CREATE TABLE public.reading_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  pages_read INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENT_SESSIONS TABLE
CREATE TABLE public.payment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  authority TEXT NOT NULL UNIQUE,
  plan_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  ref_id TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GEMINI_API_KEYS TABLE
CREATE TABLE public.gemini_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_name TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SYNC_QUEUE TABLE (PWA Offline)
CREATE TABLE public.sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id UUID NOT NULL,
  data JSONB NOT NULL,
  synced BOOLEAN DEFAULT FALSE,
  sync_attempts INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

-- OFFLINE_CONTENT_CACHE TABLE (PWA Offline)
CREATE TABLE public.offline_content_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT TRUE,
  size_bytes INTEGER,
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, book_id)
);

-- ============================================
-- STEP 4: CREATE INDEXES
-- ============================================

-- Profiles indexes
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_subscription ON public.profiles(subscription_tier, subscription_status);
CREATE INDEX idx_profiles_xp ON public.profiles(xp DESC);
CREATE INDEX idx_profiles_role ON public.profiles(role) WHERE role = 'admin';
CREATE INDEX idx_profiles_last_read ON public.profiles(last_read_at DESC) WHERE last_read_at IS NOT NULL;

-- Books indexes
CREATE INDEX idx_books_sanity_id ON public.books(sanity_id);
CREATE INDEX idx_books_slug ON public.books(slug);
CREATE INDEX idx_books_status ON public.books(status) WHERE status = 'published';
CREATE INDEX idx_books_featured ON public.books(featured) WHERE featured = TRUE;
CREATE INDEX idx_books_author_id ON public.books(author_id);
CREATE INDEX idx_books_category_id ON public.books(category_id);
CREATE INDEX idx_books_rating ON public.books(rating DESC);
CREATE INDEX idx_books_genres ON public.books USING GIN(genres);

-- User Library indexes
CREATE INDEX idx_user_library_user_id ON public.user_library(user_id);
CREATE INDEX idx_user_library_book_id ON public.user_library(book_id);
CREATE INDEX idx_user_library_status ON public.user_library(user_id, status);
CREATE INDEX idx_user_library_last_read ON public.user_library(user_id, last_read_at DESC);

-- Vocabulary indexes
CREATE INDEX idx_vocabulary_user_id ON public.vocabulary(user_id);
CREATE INDEX idx_vocabulary_word ON public.vocabulary(word);
CREATE INDEX idx_vocabulary_next_review ON public.vocabulary(user_id, next_review_at) WHERE status != 'mastered';
CREATE INDEX idx_vocabulary_status ON public.vocabulary(user_id, status);

-- Other indexes
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_book_id ON public.bookmarks(book_id);
CREATE INDEX idx_highlights_user_id ON public.highlights(user_id);
CREATE INDEX idx_highlights_book_id ON public.highlights(book_id);
CREATE INDEX idx_reviews_book_id ON public.reviews(book_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX idx_liked_books_user_id ON public.liked_books(user_id);
CREATE INDEX idx_liked_books_book_id ON public.liked_books(book_id);
CREATE INDEX idx_achievements_requirement ON public.achievements(requirement_type, requirement_value);
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_earned_at ON public.user_achievements(earned_at DESC);
CREATE INDEX idx_reading_sessions_user_id ON public.reading_sessions(user_id);
CREATE INDEX idx_reading_sessions_book_id ON public.reading_sessions(book_id);
CREATE INDEX idx_reading_sessions_created_at ON public.reading_sessions(created_at DESC);
CREATE INDEX idx_payment_sessions_user_id ON public.payment_sessions(user_id);
CREATE INDEX idx_payment_sessions_authority ON public.payment_sessions(authority);
CREATE INDEX idx_payment_sessions_status ON public.payment_sessions(status);
CREATE INDEX idx_payment_sessions_created_at ON public.payment_sessions(created_at DESC);
CREATE INDEX idx_gemini_api_keys_active ON public.gemini_api_keys(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_sync_queue_user_id ON public.sync_queue(user_id);
CREATE INDEX idx_sync_queue_synced ON public.sync_queue(synced) WHERE synced = FALSE;
CREATE INDEX idx_sync_queue_created_at ON public.sync_queue(created_at DESC);
CREATE INDEX idx_offline_cache_user_id ON public.offline_content_cache(user_id);
CREATE INDEX idx_offline_cache_expires_at ON public.offline_content_cache(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- STEP 5: CREATE FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_library_updated_at BEFORE UPDATE ON public.user_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vocabulary_updated_at BEFORE UPDATE ON public.vocabulary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_sessions_updated_at BEFORE UPDATE ON public.payment_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update book rating function
CREATE OR REPLACE FUNCTION update_book_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.books
  SET 
    rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM public.reviews WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE book_id = COALESCE(NEW.book_id, OLD.book_id))
  WHERE id = COALESCE(NEW.book_id, OLD.book_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_book_rating_on_review AFTER INSERT OR UPDATE OR DELETE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_book_rating();

-- Update user streak function
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.last_read_at = CURRENT_DATE - INTERVAL '1 day' THEN
    NEW.current_streak = OLD.current_streak + 1;
    NEW.longest_streak = GREATEST(OLD.longest_streak, NEW.current_streak);
  ELSIF OLD.last_read_at < CURRENT_DATE - INTERVAL '1 day' OR OLD.last_read_at IS NULL THEN
    NEW.current_streak = 1;
  ELSIF OLD.last_read_at = CURRENT_DATE THEN
    NEW.current_streak = OLD.current_streak;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_streak_on_read BEFORE UPDATE OF last_read_at ON public.profiles FOR EACH ROW WHEN (NEW.last_read_at IS DISTINCT FROM OLD.last_read_at) EXECUTE FUNCTION update_user_streak();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liked_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gemini_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_content_cache ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Books policies
CREATE POLICY "Published books are viewable by everyone" ON public.books FOR SELECT USING (status = 'published');
CREATE POLICY "Only admins can manage books" ON public.books FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- User Library policies
CREATE POLICY "Users can manage own library" ON public.user_library FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Vocabulary policies
CREATE POLICY "Users can manage own vocabulary" ON public.vocabulary FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Highlights policies
CREATE POLICY "Users can manage own highlights" ON public.highlights FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Liked Books policies
CREATE POLICY "Users can manage own liked books" ON public.liked_books FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Only admins can manage achievements" ON public.achievements FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- User Achievements policies
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can award achievements" ON public.user_achievements FOR INSERT WITH CHECK (true);

-- Reading Sessions policies
CREATE POLICY "Users can view own reading sessions" ON public.reading_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own reading sessions" ON public.reading_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payment Sessions policies
CREATE POLICY "Users can view own payment sessions" ON public.payment_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payment sessions" ON public.payment_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "System can update payment sessions" ON public.payment_sessions FOR UPDATE USING (true);

-- Gemini API Keys policies
CREATE POLICY "Only admins can manage API keys" ON public.gemini_api_keys FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Sync Queue policies
CREATE POLICY "Users can manage own sync queue" ON public.sync_queue FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Offline Content Cache policies
CREATE POLICY "Users can manage own offline cache" ON public.offline_content_cache FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Authors & Categories policies
CREATE POLICY "Authors are viewable by everyone" ON public.authors FOR SELECT USING (true);
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Only admins can manage authors" ON public.authors FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Only admins can manage categories" ON public.categories FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- STEP 7: SEED DEFAULT DATA
-- ============================================

-- Seed achievements
INSERT INTO public.achievements (name, description, icon, points, requirement_type, requirement_value) VALUES
  ('First Steps', 'Read your first book', '📖', 10, 'books_read', 1),
  ('Bookworm', 'Read 10 books', '🐛', 50, 'books_read', 10),
  ('Scholar', 'Read 50 books', '🎓', 200, 'books_read', 50),
  ('Page Turner', 'Read 100 pages', '📄', 20, 'pages_read', 100),
  ('Marathon Reader', 'Read 1000 pages', '🏃', 100, 'pages_read', 1000),
  ('Consistent', 'Maintain a 7-day streak', '🔥', 30, 'streak_days', 7),
  ('Dedicated', 'Maintain a 30-day streak', '⚡', 150, 'streak_days', 30),
  ('Word Collector', 'Save 50 words', '📝', 25, 'words_saved', 50),
  ('Vocabulary Master', 'Save 500 words', '📚', 200, 'words_saved', 500)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- SETUP COMPLETE!
-- ============================================

SELECT '✅ KETAB-YAR DATABASE SETUP COMPLETE!' as status,
       '📊 All tables, indexes, functions, triggers, and RLS policies created' as message,
       '🎯 Ready to use!' as next_step;
