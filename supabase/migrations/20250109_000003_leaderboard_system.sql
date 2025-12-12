-- ============================================
-- LEADERBOARD SYSTEM
-- ============================================
-- Track XP gains by time period for leaderboards
-- Date: 2025-01-09
-- ============================================

-- ============================================
-- LEADERBOARD TRACKING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    xp_gained INTEGER NOT NULL DEFAULT 0,
    pages_read INTEGER NOT NULL DEFAULT 0,
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, period_type, period_start)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON public.leaderboard_entries(period_type, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_leaderboard_xp ON public.leaderboard_entries(period_type, xp_gained DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON public.leaderboard_entries(user_id, period_type);
-- Removed partial index with CURRENT_DATE (not immutable)
-- The idx_leaderboard_period index covers queries filtering by period_start/period_end

-- ============================================
-- FUNCTION: Get Current Period Dates
-- ============================================

CREATE OR REPLACE FUNCTION get_period_dates(period TEXT)
RETURNS TABLE(period_start DATE, period_end DATE) AS $$
BEGIN
    CASE period
        WHEN 'daily' THEN
            RETURN QUERY SELECT CURRENT_DATE, CURRENT_DATE;
        WHEN 'weekly' THEN
            RETURN QUERY SELECT 
                DATE_TRUNC('week', CURRENT_DATE)::DATE,
                (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE;
        WHEN 'monthly' THEN
            RETURN QUERY SELECT 
                DATE_TRUNC('month', CURRENT_DATE)::DATE,
                (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
        WHEN 'yearly' THEN
            RETURN QUERY SELECT 
                DATE_TRUNC('year', CURRENT_DATE)::DATE,
                (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' - INTERVAL '1 day')::DATE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Update Leaderboard Entry
-- ============================================

CREATE OR REPLACE FUNCTION update_leaderboard_entry(
    p_user_id UUID,
    p_xp_gained INTEGER,
    p_pages_read INTEGER,
    p_period_type TEXT
)
RETURNS VOID AS $$
DECLARE
    v_period_start DATE;
    v_period_end DATE;
BEGIN
    -- Get period dates
    SELECT * INTO v_period_start, v_period_end 
    FROM get_period_dates(p_period_type);
    
    -- Insert or update leaderboard entry
    INSERT INTO public.leaderboard_entries (
        user_id,
        xp_gained,
        pages_read,
        period_type,
        period_start,
        period_end
    ) VALUES (
        p_user_id,
        p_xp_gained,
        p_pages_read,
        p_period_type,
        v_period_start,
        v_period_end
    )
    ON CONFLICT (user_id, period_type, period_start)
    DO UPDATE SET
        xp_gained = leaderboard_entries.xp_gained + EXCLUDED.xp_gained,
        pages_read = leaderboard_entries.pages_read + EXCLUDED.pages_read,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Record Reading Session for Leaderboard
-- ============================================

CREATE OR REPLACE FUNCTION record_leaderboard_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all period types
    PERFORM update_leaderboard_entry(NEW.user_id, NEW.xp_earned, NEW.pages_read, 'daily');
    PERFORM update_leaderboard_entry(NEW.user_id, NEW.xp_earned, NEW.pages_read, 'weekly');
    PERFORM update_leaderboard_entry(NEW.user_id, NEW.xp_earned, NEW.pages_read, 'monthly');
    PERFORM update_leaderboard_entry(NEW.user_id, NEW.xp_earned, NEW.pages_read, 'yearly');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-update leaderboard on reading session
-- ============================================

DROP TRIGGER IF EXISTS trigger_update_leaderboard ON public.reading_sessions;

CREATE TRIGGER trigger_update_leaderboard
    AFTER INSERT ON public.reading_sessions
    FOR EACH ROW
    EXECUTE FUNCTION record_leaderboard_activity();

-- ============================================
-- FUNCTION: Get Leaderboard Rankings
-- ============================================

CREATE OR REPLACE FUNCTION get_leaderboard(
    p_period_type TEXT,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
    rank BIGINT,
    user_id UUID,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    xp_gained INTEGER,
    pages_read INTEGER,
    total_xp INTEGER,
    level INTEGER
) AS $$
DECLARE
    v_period_start DATE;
    v_period_end DATE;
BEGIN
    -- Get current period dates
    SELECT * INTO v_period_start, v_period_end 
    FROM get_period_dates(p_period_type);
    
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY le.xp_gained DESC, le.pages_read DESC) as rank,
        p.id as user_id,
        p.username,
        p.full_name,
        p.avatar_url,
        le.xp_gained,
        le.pages_read,
        p.xp as total_xp,
        LEAST(99, GREATEST(1, FLOOR(10 * SQRT(p.xp / 100.0))))::INTEGER as level
    FROM public.leaderboard_entries le
    JOIN public.profiles p ON le.user_id = p.id
    WHERE 
        le.period_type = p_period_type
        AND le.period_start = v_period_start
        AND le.period_end = v_period_end
        AND p.is_banned = FALSE
    ORDER BY le.xp_gained DESC, le.pages_read DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Get User Rank in Leaderboard
-- ============================================

CREATE OR REPLACE FUNCTION get_user_rank(
    p_user_id UUID,
    p_period_type TEXT
)
RETURNS TABLE(
    rank BIGINT,
    xp_gained INTEGER,
    pages_read INTEGER,
    total_users BIGINT
) AS $$
DECLARE
    v_period_start DATE;
    v_period_end DATE;
BEGIN
    -- Get current period dates
    SELECT * INTO v_period_start, v_period_end 
    FROM get_period_dates(p_period_type);
    
    RETURN QUERY
    WITH ranked_users AS (
        SELECT 
            le.user_id,
            le.xp_gained,
            le.pages_read,
            ROW_NUMBER() OVER (ORDER BY le.xp_gained DESC, le.pages_read DESC) as user_rank
        FROM public.leaderboard_entries le
        JOIN public.profiles p ON le.user_id = p.id
        WHERE 
            le.period_type = p_period_type
            AND le.period_start = v_period_start
            AND le.period_end = v_period_end
            AND p.is_banned = FALSE
    )
    SELECT 
        ru.user_rank as rank,
        ru.xp_gained,
        ru.pages_read,
        (SELECT COUNT(*) FROM ranked_users) as total_users
    FROM ranked_users ru
    WHERE ru.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.leaderboard_entries IS 'Tracks XP and pages read by time period for leaderboards';
COMMENT ON FUNCTION get_leaderboard IS 'Get ranked leaderboard for a specific period (daily, weekly, monthly, yearly)';
COMMENT ON FUNCTION get_user_rank IS 'Get user rank and stats for a specific period';
