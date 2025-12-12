-- ============================================
-- XP MANAGEMENT FUNCTIONS
-- ============================================
-- Functions for safely updating XP and checking achievements
-- Date: 2025-01-09
-- ============================================

-- ============================================
-- FUNCTION: Increment User XP
-- ============================================

CREATE OR REPLACE FUNCTION increment_user_xp(
    user_id UUID,
    xp_amount INTEGER
)
RETURNS TABLE(
    old_xp INTEGER,
    new_xp INTEGER,
    old_level INTEGER,
    new_level INTEGER,
    level_up BOOLEAN
) AS $$
DECLARE
    v_old_xp INTEGER;
    v_new_xp INTEGER;
    v_old_level INTEGER;
    v_new_level INTEGER;
BEGIN
    -- Get current XP
    SELECT xp INTO v_old_xp
    FROM public.profiles
    WHERE id = user_id;
    
    -- Calculate new XP
    v_new_xp := v_old_xp + xp_amount;
    
    -- Calculate levels
    v_old_level := LEAST(99, GREATEST(1, FLOOR(10 * SQRT(v_old_xp / 100.0))));
    v_new_level := LEAST(99, GREATEST(1, FLOOR(10 * SQRT(v_new_xp / 100.0))));
    
    -- Update XP
    UPDATE public.profiles
    SET xp = v_new_xp,
        updated_at = NOW()
    WHERE id = user_id;
    
    -- Return results
    RETURN QUERY SELECT 
        v_old_xp,
        v_new_xp,
        v_old_level,
        v_new_level,
        v_new_level > v_old_level;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Award Reading XP with Bonuses
-- ============================================

CREATE OR REPLACE FUNCTION award_reading_xp(
    p_user_id UUID,
    p_pages_read INTEGER,
    p_book_level TEXT DEFAULT 'intermediate',
    p_completed_book BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    base_xp INTEGER,
    streak_bonus INTEGER,
    difficulty_bonus INTEGER,
    completion_bonus INTEGER,
    total_xp INTEGER,
    old_level INTEGER,
    new_level INTEGER,
    level_up BOOLEAN
) AS $$
DECLARE
    v_base_xp INTEGER;
    v_streak_bonus INTEGER := 0;
    v_difficulty_bonus INTEGER := 0;
    v_completion_bonus INTEGER := 0;
    v_total_xp INTEGER;
    v_current_streak INTEGER;
    v_result RECORD;
BEGIN
    -- Calculate base XP (2 per page)
    v_base_xp := p_pages_read * 2;
    
    -- Get user's current streak
    SELECT current_streak INTO v_current_streak
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Calculate streak bonus (up to 100% at 30+ days)
    IF v_current_streak > 0 THEN
        v_streak_bonus := FLOOR(v_base_xp * LEAST(1.0, v_current_streak / 30.0));
    END IF;
    
    -- Calculate difficulty bonus
    CASE p_book_level
        WHEN 'advanced' THEN
            v_difficulty_bonus := FLOOR(v_base_xp * 0.5);
        WHEN 'intermediate' THEN
            v_difficulty_bonus := FLOOR(v_base_xp * 0.25);
        ELSE
            v_difficulty_bonus := 0;
    END CASE;
    
    -- Completion bonus
    IF p_completed_book THEN
        v_completion_bonus := 200;
    END IF;
    
    -- Calculate total
    v_total_xp := v_base_xp + v_streak_bonus + v_difficulty_bonus + v_completion_bonus;
    
    -- Award XP
    SELECT * INTO v_result
    FROM increment_user_xp(p_user_id, v_total_xp);
    
    -- Return breakdown
    RETURN QUERY SELECT
        v_base_xp,
        v_streak_bonus,
        v_difficulty_bonus,
        v_completion_bonus,
        v_total_xp,
        v_result.old_level,
        v_result.new_level,
        v_result.level_up;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Get User Level from XP
-- ============================================

CREATE OR REPLACE FUNCTION get_user_level(p_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN LEAST(99, GREATEST(1, FLOOR(10 * SQRT(p_xp / 100.0))));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- FUNCTION: Get XP for Level
-- ============================================

CREATE OR REPLACE FUNCTION get_xp_for_level(p_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
    IF p_level <= 1 THEN
        RETURN 0;
    END IF;
    
    IF p_level >= 99 THEN
        RETURN 1000000;
    END IF;
    
    RETURN FLOOR(POWER(p_level / 10.0, 2) * 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION increment_user_xp IS 'Safely increment user XP and return level change info';
COMMENT ON FUNCTION award_reading_xp IS 'Award XP for reading with all bonuses calculated';
COMMENT ON FUNCTION get_user_level IS 'Calculate level from XP amount';
COMMENT ON FUNCTION get_xp_for_level IS 'Calculate XP needed for a specific level';
