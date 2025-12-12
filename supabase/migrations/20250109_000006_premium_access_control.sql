-- ============================================
-- PREMIUM ACCESS CONTROL SYSTEM
-- ============================================
-- Automatic unlimited premium access for admins and test users
-- Date: 2025-01-09
-- ============================================

-- ============================================
-- FUNCTION: Check if user can access a book
-- ============================================

CREATE OR REPLACE FUNCTION can_access_book(book_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_subscription TEXT;
    user_sub_status TEXT;
    user_sub_expires TIMESTAMPTZ;
    book_is_premium BOOLEAN;
BEGIN
    -- Get user role and subscription info
    SELECT role, subscription_tier, subscription_status, subscription_expires_at
    INTO user_role, user_subscription, user_sub_status, user_sub_expires
    FROM public.profiles
    WHERE id = auth.uid();
    
    -- Admins and test users have UNLIMITED access to ALL books
    IF user_role IN ('admin', 'test_user') THEN
        RETURN TRUE;
    END IF;
    
    -- Get book premium status
    SELECT is_premium INTO book_is_premium
    FROM public.books
    WHERE id = book_id;
    
    -- If book doesn't exist, deny access
    IF book_is_premium IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Free books are accessible to everyone
    IF book_is_premium = FALSE THEN
        RETURN TRUE;
    END IF;
    
    -- Premium books require active subscription
    IF user_subscription IN ('monthly', 'quarterly', 'annual') 
       AND user_sub_status = 'active'
       AND user_sub_expires > NOW() THEN
        RETURN TRUE;
    END IF;
    
    -- Default: no access to premium books
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Check if user has premium access (general)
-- ============================================

CREATE OR REPLACE FUNCTION has_premium_access()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_subscription TEXT;
    user_sub_status TEXT;
    user_sub_expires TIMESTAMPTZ;
BEGIN
    -- Get user info
    SELECT role, subscription_tier, subscription_status, subscription_expires_at
    INTO user_role, user_subscription, user_sub_status, user_sub_expires
    FROM public.profiles
    WHERE id = auth.uid();
    
    -- Admins and test users ALWAYS have premium access
    IF user_role IN ('admin', 'test_user') THEN
        RETURN TRUE;
    END IF;
    
    -- Check active subscription
    IF user_subscription IN ('monthly', 'quarterly', 'annual') 
       AND user_sub_status = 'active'
       AND user_sub_expires > NOW() THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE EXISTING TEST USERS
-- ============================================

-- Give all existing test users a "virtual" premium subscription
-- This is for UI display purposes (they already have access via role)
UPDATE public.profiles
SET 
    subscription_tier = 'annual',
    subscription_status = 'active',
    subscription_started_at = NOW(),
    subscription_expires_at = NOW() + INTERVAL '100 years' -- Effectively unlimited
WHERE role = 'test_user'
AND subscription_tier = 'free';

-- Give all admins a "virtual" premium subscription
UPDATE public.profiles
SET 
    subscription_tier = 'annual',
    subscription_status = 'active',
    subscription_started_at = NOW(),
    subscription_expires_at = NOW() + INTERVAL '100 years' -- Effectively unlimited
WHERE role = 'admin'
AND subscription_tier = 'free';

-- ============================================
-- TRIGGER: Auto-grant premium to new admins/test users
-- ============================================

CREATE OR REPLACE FUNCTION auto_grant_premium_to_special_roles()
RETURNS TRIGGER AS $$
BEGIN
    -- When a user becomes admin or test_user, give them unlimited premium
    IF NEW.role IN ('admin', 'test_user') AND OLD.role = 'user' THEN
        NEW.subscription_tier := 'annual';
        NEW.subscription_status := 'active';
        NEW.subscription_started_at := NOW();
        NEW.subscription_expires_at := NOW() + INTERVAL '100 years';
    END IF;
    
    -- When admin/test_user becomes regular user, remove premium (unless they have real subscription)
    IF NEW.role = 'user' AND OLD.role IN ('admin', 'test_user') THEN
        -- Only remove if they don't have a real Stripe subscription
        IF NEW.stripe_subscription_id IS NULL THEN
            NEW.subscription_tier := 'free';
            NEW.subscription_status := 'inactive';
            NEW.subscription_expires_at := NULL;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_grant_premium ON public.profiles;
CREATE TRIGGER trigger_auto_grant_premium
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION auto_grant_premium_to_special_roles();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION can_access_book IS 'Check if current user can access a specific book (admins and test users have unlimited access)';
COMMENT ON FUNCTION has_premium_access IS 'Check if current user has general premium access (admins and test users always return true)';
COMMENT ON FUNCTION auto_grant_premium_to_special_roles IS 'Automatically grant unlimited premium subscription when user becomes admin or test_user';

