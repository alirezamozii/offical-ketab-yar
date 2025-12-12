-- ============================================
-- KETAB-YAR: ROW LEVEL SECURITY (RLS)
-- ============================================
-- Security policies for all tables
-- Date: 2025-01-01
-- ============================================

-- ============================================
-- ENABLE RLS ON ALL TABLES
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

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view all profiles (for leaderboards, etc.)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (handled by trigger, but allow for manual creation)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- BOOKS POLICIES (Public Read)
-- ============================================

-- Everyone can read published books
CREATE POLICY "Published books are viewable by everyone"
  ON public.books FOR SELECT
  USING (status = 'published');

-- Only admins can insert/update/delete books
CREATE POLICY "Only admins can manage books"
  ON public.books FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- USER_LIBRARY POLICIES
-- ============================================

-- Users can view their own library
CREATE POLICY "Users can view own library"
  ON public.user_library FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert to their own library
CREATE POLICY "Users can add to own library"
  ON public.user_library FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own library
CREATE POLICY "Users can update own library"
  ON public.user_library FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete from their own library
CREATE POLICY "Users can delete from own library"
  ON public.user_library FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- VOCABULARY POLICIES
-- ============================================

-- Users can view their own vocabulary
CREATE POLICY "Users can view own vocabulary"
  ON public.vocabulary FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert to their own vocabulary
CREATE POLICY "Users can add to own vocabulary"
  ON public.vocabulary FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own vocabulary
CREATE POLICY "Users can update own vocabulary"
  ON public.vocabulary FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete from their own vocabulary
CREATE POLICY "Users can delete from own vocabulary"
  ON public.vocabulary FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- BOOKMARKS POLICIES
-- ============================================

CREATE POLICY "Users can manage own bookmarks"
  ON public.bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- HIGHLIGHTS POLICIES
-- ============================================

CREATE POLICY "Users can manage own highlights"
  ON public.highlights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- REVIEWS POLICIES
-- ============================================

-- Everyone can read reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

-- Users can create their own reviews
CREATE POLICY "Users can create own reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- LIKED_BOOKS POLICIES
-- ============================================

CREATE POLICY "Users can manage own liked books"
  ON public.liked_books FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ACHIEVEMENTS POLICIES
-- ============================================

-- Everyone can read achievements
CREATE POLICY "Achievements are viewable by everyone"
  ON public.achievements FOR SELECT
  USING (true);

-- Only admins can manage achievements
CREATE POLICY "Only admins can manage achievements"
  ON public.achievements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- USER_ACHIEVEMENTS POLICIES
-- ============================================

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert achievements (via functions)
CREATE POLICY "System can award achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (true);

-- ============================================
-- READING_SESSIONS POLICIES
-- ============================================

-- Users can view their own sessions
CREATE POLICY "Users can view own reading sessions"
  ON public.reading_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can create own reading sessions"
  ON public.reading_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PAYMENT_SESSIONS POLICIES
-- ============================================

-- Users can view their own payment sessions
CREATE POLICY "Users can view own payment sessions"
  ON public.payment_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own payment sessions
CREATE POLICY "Users can create own payment sessions"
  ON public.payment_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- System can update payment sessions (via API)
CREATE POLICY "System can update payment sessions"
  ON public.payment_sessions FOR UPDATE
  USING (true);

-- ============================================
-- GEMINI_API_KEYS POLICIES
-- ============================================

-- Only admins can manage API keys
CREATE POLICY "Only admins can manage API keys"
  ON public.gemini_api_keys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- SYNC_QUEUE POLICIES
-- ============================================

-- Users can manage their own sync queue
CREATE POLICY "Users can manage own sync queue"
  ON public.sync_queue FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- OFFLINE_CONTENT_CACHE POLICIES
-- ============================================

-- Users can manage their own offline cache
CREATE POLICY "Users can manage own offline cache"
  ON public.offline_content_cache FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- AUTHORS & CATEGORIES POLICIES
-- ============================================

-- Everyone can read authors and categories
CREATE POLICY "Authors are viewable by everyone"
  ON public.authors FOR SELECT
  USING (true);

CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

-- Only admins can manage authors and categories
CREATE POLICY "Only admins can manage authors"
  ON public.authors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can manage categories"
  ON public.categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
