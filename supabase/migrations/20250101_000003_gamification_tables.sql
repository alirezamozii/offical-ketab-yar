-- ============================================
-- KETAB-YAR: GAMIFICATION TABLES
-- ============================================
-- Achievement system and reading analytics (Agent 3)
-- Date: 2025-01-01
-- ============================================

-- ============================================
-- 1. ACHIEVEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT, -- Emoji or icon name
  points INTEGER DEFAULT 0,
  requirement_type TEXT CHECK (requirement_type IN ('books_read', 'pages_read', 'streak_days', 'words_saved', 'xp_earned')),
  requirement_value INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. USER_ACHIEVEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- 3. READING_SESSIONS (Analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS public.reading_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  pages_read INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Achievements
CREATE INDEX IF NOT EXISTS idx_achievements_requirement ON public.achievements(requirement_type, requirement_value);

-- User Achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON public.user_achievements(earned_at DESC);

-- Reading Sessions
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON public.reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book_id ON public.reading_sessions(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_created_at ON public.reading_sessions(created_at DESC);

-- ============================================
-- SEED DEFAULT ACHIEVEMENTS
-- ============================================

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
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.achievements IS 'Gamification achievements';
COMMENT ON TABLE public.user_achievements IS 'User earned achievements';
COMMENT ON TABLE public.reading_sessions IS 'Analytics data for reading sessions';
