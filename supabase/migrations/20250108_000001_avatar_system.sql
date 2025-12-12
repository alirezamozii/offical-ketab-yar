-- ============================================
-- KETAB-YAR: AVATAR SYSTEM & ENHANCED REGISTRATION
-- ============================================
-- Complete user profile system with avatars, username, birthday, gender
-- Date: 2025-01-08
-- ============================================

-- ============================================
-- 1. UPDATE PROFILES TABLE WITH NEW FIELDS
-- ============================================

-- Username (unique identifier for social features)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,

-- Birthday (both Gregorian and Jalali)
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS birth_date_jalali TEXT, -- Format: "1380/05/15"
ADD COLUMN IF NOT EXISTS age INTEGER,

-- Gender
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'prefer_not_to_say')),

-- Avatar System
ADD COLUMN IF NOT EXISTS avatar_type TEXT DEFAULT 'preset' CHECK (avatar_type IN ('preset', 'google', 'custom', 'initials')),
ADD COLUMN IF NOT EXISTS avatar_preset_id INTEGER CHECK (avatar_preset_id BETWEEN 1 AND 6),
ADD COLUMN IF NOT EXISTS avatar_custom_url TEXT,

-- Marketing & Analytics
ADD COLUMN IF NOT EXISTS referral_source TEXT,
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS newsletter_subscribed BOOLEAN DEFAULT FALSE,

-- Registration tracking
ADD COLUMN IF NOT EXISTS registration_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS registration_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS registration_completed_at TIMESTAMPTZ,

-- Account activity
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_profiles_birth_date ON public.profiles(birth_date) WHERE birth_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender) WHERE gender IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_type ON public.profiles(avatar_type);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by) WHERE referred_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON public.profiles(last_login_at DESC);

-- ============================================
-- 3. FUNCTION: GENERATE UNIQUE USERNAME
-- ============================================

CREATE OR REPLACE FUNCTION generate_unique_username(base_name TEXT)
RETURNS TEXT AS $$
DECLARE
  username_candidate TEXT;
  counter INTEGER := 0;
  clean_name TEXT;
BEGIN
  -- Remove Persian/Arabic characters and special chars, keep only a-z, 0-9
  clean_name := LOWER(REGEXP_REPLACE(base_name, '[^a-zA-Z0-9]', '', 'g'));
  
  -- If empty after cleaning, use random
  IF clean_name = '' OR LENGTH(clean_name) < 3 THEN
    clean_name := 'user' || FLOOR(RANDOM() * 10000)::TEXT;
  END IF;
  
  -- Limit to 20 characters
  clean_name := SUBSTRING(clean_name FROM 1 FOR 20);
  
  username_candidate := clean_name;
  
  -- Keep trying until we find a unique username
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(username_candidate)) LOOP
    counter := counter + 1;
    username_candidate := clean_name || counter;
  END LOOP;
  
  RETURN username_candidate;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. FUNCTION: CALCULATE AGE FROM BIRTH DATE
-- ============================================

CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  IF birth_date IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 5. TRIGGER: AUTO-UPDATE AGE
-- ============================================

CREATE OR REPLACE FUNCTION update_age_from_birth_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.birth_date IS NOT NULL THEN
    NEW.age := calculate_age(NEW.birth_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_age
  BEFORE INSERT OR UPDATE OF birth_date ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_age_from_birth_date();

-- ============================================
-- 6. FUNCTION: VALIDATE USERNAME FORMAT
-- ============================================

CREATE OR REPLACE FUNCTION is_valid_username(username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Username must be 3-20 characters, only a-z, 0-9, underscore
  RETURN username ~ '^[a-z0-9_]{3,20}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 7. TRIGGER: VALIDATE USERNAME ON INSERT/UPDATE
-- ============================================

CREATE OR REPLACE FUNCTION validate_username()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.username IS NOT NULL THEN
    -- Convert to lowercase
    NEW.username := LOWER(NEW.username);
    
    -- Validate format
    IF NOT is_valid_username(NEW.username) THEN
      RAISE EXCEPTION 'Invalid username format. Must be 3-20 characters, only a-z, 0-9, underscore';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_username
  BEFORE INSERT OR UPDATE OF username ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_username();

-- ============================================
-- 8. FUNCTION: GET AVATAR URL
-- ============================================

CREATE OR REPLACE FUNCTION get_avatar_url(profile_row public.profiles)
RETURNS TEXT AS $$
BEGIN
  CASE profile_row.avatar_type
    WHEN 'preset' THEN
      RETURN '/avatars/preset-' || profile_row.avatar_preset_id || '.svg';
    WHEN 'google' THEN
      RETURN profile_row.avatar_url;
    WHEN 'custom' THEN
      RETURN profile_row.avatar_custom_url;
    WHEN 'initials' THEN
      RETURN NULL; -- Will be generated client-side
    ELSE
      RETURN '/avatars/preset-1.svg'; -- Default
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 9. CREATE REFERRAL CODES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_code_format CHECK (code ~ '^[A-Z0-9]{6,12}$')
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON public.referral_codes(user_id);

-- ============================================
-- 10. FUNCTION: GENERATE REFERRAL CODE
-- ============================================

CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  code_candidate TEXT;
  username_part TEXT;
BEGIN
  -- Get username
  SELECT username INTO username_part FROM public.profiles WHERE id = user_id;
  
  -- Generate code from username + random
  IF username_part IS NOT NULL THEN
    code_candidate := UPPER(SUBSTRING(username_part FROM 1 FOR 4)) || 
                     LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  ELSE
    code_candidate := 'USER' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 6, '0');
  END IF;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.referral_codes WHERE code = code_candidate) LOOP
    code_candidate := 'USER' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 6, '0');
  END LOOP;
  
  -- Insert code
  INSERT INTO public.referral_codes (code, user_id)
  VALUES (code_candidate, user_id);
  
  RETURN code_candidate;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. TRIGGER: AUTO-GENERATE REFERRAL CODE
-- ============================================

CREATE OR REPLACE FUNCTION create_referral_code_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate referral code when registration is completed
  IF NEW.registration_completed = TRUE AND OLD.registration_completed = FALSE THEN
    PERFORM generate_referral_code(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_referral_code
  AFTER UPDATE OF registration_completed ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_code_for_user();

-- ============================================
-- 12. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN public.profiles.username IS 'Unique username for social features and profile URLs';
COMMENT ON COLUMN public.profiles.first_name IS 'User first name';
COMMENT ON COLUMN public.profiles.last_name IS 'User last name';
COMMENT ON COLUMN public.profiles.birth_date IS 'Birth date in Gregorian calendar';
COMMENT ON COLUMN public.profiles.birth_date_jalali IS 'Birth date in Jalali/Persian calendar (e.g., 1380/05/15)';
COMMENT ON COLUMN public.profiles.age IS 'Auto-calculated age from birth_date';
COMMENT ON COLUMN public.profiles.gender IS 'User gender (optional)';
COMMENT ON COLUMN public.profiles.avatar_type IS 'Type of avatar: preset (1-6), google, custom, or initials';
COMMENT ON COLUMN public.profiles.avatar_preset_id IS 'ID of preset avatar (1-6)';
COMMENT ON COLUMN public.profiles.avatar_custom_url IS 'URL of custom uploaded avatar or Google photo';
COMMENT ON COLUMN public.profiles.referral_source IS 'How user found the platform (marketing data)';
COMMENT ON COLUMN public.profiles.referral_code IS 'Referral code used during signup';
COMMENT ON COLUMN public.profiles.referred_by IS 'User ID who referred this user';
COMMENT ON COLUMN public.profiles.marketing_consent IS 'User consent for marketing emails';
COMMENT ON COLUMN public.profiles.registration_completed IS 'Whether user completed all registration steps';
COMMENT ON COLUMN public.profiles.registration_step IS 'Current step in registration process (0-3)';

COMMENT ON TABLE public.referral_codes IS 'User referral codes for viral growth';
COMMENT ON FUNCTION generate_unique_username(TEXT) IS 'Generates a unique username from a base name';
COMMENT ON FUNCTION calculate_age(DATE) IS 'Calculates age from birth date';
COMMENT ON FUNCTION get_avatar_url(public.profiles) IS 'Returns the appropriate avatar URL based on avatar type';

-- ============================================
-- 13. UPDATE EXISTING PROFILES (MIGRATION)
-- ============================================

-- Set default avatar for existing users
UPDATE public.profiles 
SET 
  avatar_type = 'initials',
  avatar_preset_id = 1,
  registration_completed = TRUE,
  registration_step = 3
WHERE avatar_type IS NULL;

-- Generate usernames for existing users without one
DO $$
DECLARE
  profile_record RECORD;
  new_username TEXT;
  user_email TEXT;
BEGIN
  FOR profile_record IN 
    SELECT id, full_name 
    FROM public.profiles 
    WHERE username IS NULL
  LOOP
    -- Try to generate from full_name first
    IF profile_record.full_name IS NOT NULL AND profile_record.full_name != '' THEN
      new_username := generate_unique_username(profile_record.full_name);
    ELSE
      -- Fallback: get email from auth.users
      SELECT email INTO user_email 
      FROM auth.users 
      WHERE id = profile_record.id;
      
      IF user_email IS NOT NULL THEN
        new_username := generate_unique_username(SPLIT_PART(user_email, '@', 1));
      ELSE
        -- Last resort: generate random username
        new_username := generate_unique_username('user');
      END IF;
    END IF;
    
    UPDATE public.profiles 
    SET username = new_username 
    WHERE id = profile_record.id;
  END LOOP;
END $$;

