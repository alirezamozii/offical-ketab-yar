-- ============================================
-- Add gamification level column to profiles
-- ============================================
-- This is separate from the 'level' column which represents learning level
-- Date: 2025-01-09
-- ============================================

-- Add computed level column (calculated from XP)
-- We'll calculate this on the fly using the gamification utility function
-- No need to store it since it's derived from XP

-- Add index for XP-based queries (for leaderboards)
CREATE INDEX IF NOT EXISTS idx_profiles_xp_desc ON public.profiles(xp DESC) WHERE xp > 0;

-- Add index for streak-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_streak_desc ON public.profiles(current_streak DESC) WHERE current_streak > 0;

-- Comment
COMMENT ON COLUMN public.profiles.xp IS 'Total experience points - Level is calculated as floor(sqrt(xp/100)) + 1';
