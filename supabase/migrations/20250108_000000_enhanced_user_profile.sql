-- ============================================
-- KETAB-YAR: ENHANCED USER PROFILE
-- ============================================
-- Add comprehensive user information for better profiling,
-- social features, and marketing analytics
-- Date: 2025-01-08
-- ============================================

-- ============================================
-- 1. ADD NEW COLUMNS TO PROFILES TABLE
-- ============================================

-- Personal Information (for better personalization)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT, -- What they want to be called
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS birth_date DATE, -- For age-appropriate content
ADD COLUMN IF NOT EXISTS birth_date_jalali TEXT, -- Iranian calendar format (e.g., "1380/05/15")
ADD COLUMN IF NOT EXISTS age_group TEXT CHECK (age_group IN ('under_18', '18_24', '25_34', '35_44', '45_54', '55_plus')),

-- Location (for localized content and marketing)
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'IR', -- ISO country code
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Tehran',

-- Education & Profession (for content recommendations)
ADD COLUMN IF NOT EXISTS education_level TEXT CHECK (education_level IN ('high_school', 'diploma', 'bachelors', 'masters', 'phd', 'other')),
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS field_of_study TEXT,

-- Reading Preferences (for better recommendations)
ADD COLUMN IF NOT EXISTS favorite_genres TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reading_goal_pages_per_day INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS reading_goal_books_per_month INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS preferred_reading_time TEXT CHECK (preferred_reading_time IN ('morning', 'afternoon', 'evening', 'night', 'anytime')),

-- English Learning (core feature)
ADD COLUMN IF NOT EXISTS english_level TEXT DEFAULT 'beginner' CHECK (english_level IN ('beginner', 'elementary', 'pre_intermediate', 'intermediate', 'upper_intermediate', 'advanced', 'native')),
ADD COLUMN IF NOT EXISTS learning_goal TEXT CHECK (learning_goal IN ('general', 'academic', 'business', 'travel', 'exam_prep', 'other')),
ADD COLUMN IF NOT EXISTS target_exam TEXT, -- IELTS, TOEFL, etc.

-- Social Features (for following system)
ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS allow_friend_requests BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_reading_activity BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_statistics BOOLEAN DEFAULT TRUE,

-- Marketing & Analytics
ADD COLUMN IF NOT EXISTS referral_source TEXT, -- How they found us (google, instagram, friend, etc.)
ADD COLUMN IF NOT EXISTS referral_code TEXT, -- If referred by another user
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE, -- Email marketing
ADD COLUMN IF NOT EXISTS newsletter_subscribed BOOLEAN DEFAULT FALSE,

-- Onboarding
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,

-- Account Status
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- ============================================
-- 2. CREATE INDEXES FOR NEW COLUMNS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender) WHERE gender IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_age_group ON public.profiles(age_group) WHERE age_group IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_education ON public.profiles(education_level) WHERE education_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_english_level ON public.profiles(english_level);
CREATE INDEX IF NOT EXISTS idx_profiles_favorite_genres ON public.profiles USING GIN(favorite_genres);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_public ON public.profiles(is_profile_public) WHERE is_profile_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON public.profiles(last_login_at DESC) WHERE last_login_at IS NOT NULL;

-- ============================================
-- 3. CREATE FUNCTION TO CALCULATE AGE GROUP
-- ============================================

CREATE OR REPLACE FUNCTION calculate_age_group(birth_date DATE)
RETURNS TEXT AS $$
DECLARE
  age INTEGER;
BEGIN
  IF birth_date IS NULL THEN
    RETURN NULL;
  END IF;
  
  age := EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date));
  
  IF age < 18 THEN
    RETURN 'under_18';
  ELSIF age BETWEEN 18 AND 24 THEN
    RETURN '18_24';
  ELSIF age BETWEEN 25 AND 34 THEN
    RETURN '25_34';
  ELSIF age BETWEEN 35 AND 44 THEN
    RETURN '35_44';
  ELSIF age BETWEEN 45 AND 54 THEN
    RETURN '45_54';
  ELSE
    RETURN '55_plus';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 4. CREATE TRIGGER TO AUTO-UPDATE AGE GROUP
-- ============================================

CREATE OR REPLACE FUNCTION update_age_group()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.birth_date IS NOT NULL THEN
    NEW.age_group := calculate_age_group(NEW.birth_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_age_group
  BEFORE INSERT OR UPDATE OF birth_date ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_age_group();

-- ============================================
-- 5. CREATE FUNCTION TO GENERATE UNIQUE USERNAME
-- ============================================

CREATE OR REPLACE FUNCTION generate_unique_username(base_name TEXT)
RETURNS TEXT AS $$
DECLARE
  username_candidate TEXT;
  counter INTEGER := 0;
BEGIN
  -- Clean the base name (remove spaces, special chars, convert to lowercase)
  base_name := LOWER(REGEXP_REPLACE(base_name, '[^a-zA-Z0-9]', '', 'g'));
  
  -- Limit to 20 characters
  base_name := SUBSTRING(base_name FROM 1 FOR 20);
  
  username_candidate := base_name;
  
  -- Keep trying until we find a unique username
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = username_candidate) LOOP
    counter := counter + 1;
    username_candidate := base_name || counter;
  END LOOP;
  
  RETURN username_candidate;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN public.profiles.first_name IS 'User first name (for personalization)';
COMMENT ON COLUMN public.profiles.last_name IS 'User last name (for personalization)';
COMMENT ON COLUMN public.profiles.display_name IS 'Public display name (for social features)';
COMMENT ON COLUMN public.profiles.gender IS 'User gender (optional, for content personalization)';
COMMENT ON COLUMN public.profiles.birth_date IS 'Birth date in Gregorian calendar';
COMMENT ON COLUMN public.profiles.birth_date_jalali IS 'Birth date in Iranian/Jalali calendar (e.g., 1380/05/15)';
COMMENT ON COLUMN public.profiles.age_group IS 'Auto-calculated age group for analytics';
COMMENT ON COLUMN public.profiles.country IS 'ISO country code (default: IR for Iran)';
COMMENT ON COLUMN public.profiles.city IS 'User city (for localized content)';
COMMENT ON COLUMN public.profiles.education_level IS 'Education level (for content recommendations)';
COMMENT ON COLUMN public.profiles.profession IS 'User profession (for targeted content)';
COMMENT ON COLUMN public.profiles.english_level IS 'Self-assessed English proficiency level';
COMMENT ON COLUMN public.profiles.learning_goal IS 'Primary English learning goal';
COMMENT ON COLUMN public.profiles.favorite_genres IS 'Array of favorite book genres';
COMMENT ON COLUMN public.profiles.reading_goal_pages_per_day IS 'Daily reading goal in pages';
COMMENT ON COLUMN public.profiles.is_profile_public IS 'Whether profile is visible to other users';
COMMENT ON COLUMN public.profiles.referral_source IS 'How user discovered the platform';
COMMENT ON COLUMN public.profiles.referral_code IS 'Referral code from another user';
COMMENT ON COLUMN public.profiles.marketing_consent IS 'User consent for marketing emails';

-- ============================================
-- 7. UPDATE EXISTING PROFILES (MIGRATION)
-- ============================================

-- Set default values for existing users
UPDATE public.profiles 
SET 
  country = 'IR',
  timezone = 'Asia/Tehran',
  english_level = 'beginner',
  is_profile_public = TRUE,
  allow_friend_requests = TRUE,
  show_reading_activity = TRUE,
  show_statistics = TRUE
WHERE country IS NULL;

