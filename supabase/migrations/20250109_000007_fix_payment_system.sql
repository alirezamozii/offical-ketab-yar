-- ============================================
-- FIX PAYMENT SYSTEM
-- ============================================
-- Fix column names and ensure correct subscription flow
-- Date: 2025-01-09
-- ============================================

-- ============================================
-- 1. FIX PAYMENT_SESSIONS TABLE
-- ============================================

-- Add plan_type column if it doesn't exist (for compatibility)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_sessions' 
        AND column_name = 'plan_type'
    ) THEN
        ALTER TABLE public.payment_sessions 
        ADD COLUMN plan_type TEXT;
    END IF;
END $$;

-- Update existing records to have plan_type = plan_id
UPDATE public.payment_sessions
SET plan_type = plan_id
WHERE plan_type IS NULL AND plan_id IS NOT NULL;

-- Add check constraint for plan_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'payment_sessions_plan_type_check'
    ) THEN
        ALTER TABLE public.payment_sessions
        ADD CONSTRAINT payment_sessions_plan_type_check 
        CHECK (plan_type IN ('monthly', 'quarterly', 'annual'));
    END IF;
END $$;

-- ============================================
-- 2. ENSURE NEW USERS ARE FREE BY DEFAULT
-- ============================================

-- Update the handle_new_user function to explicitly set free tier
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    avatar_url,
    subscription_tier,
    subscription_status
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'free',  -- Explicitly set as free
    'inactive'  -- No active subscription
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. FUNCTION: Activate Subscription After Payment
-- ============================================

CREATE OR REPLACE FUNCTION activate_subscription(
    p_user_id UUID,
    p_plan_type TEXT,
    p_payment_ref_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_duration_days INTEGER;
    v_expiry_date TIMESTAMPTZ;
BEGIN
    -- Calculate duration based on plan type
    CASE p_plan_type
        WHEN 'monthly' THEN v_duration_days := 30;
        WHEN 'quarterly' THEN v_duration_days := 90;
        WHEN 'annual' THEN v_duration_days := 365;
        ELSE RETURN FALSE;
    END CASE;
    
    -- Calculate expiry date
    v_expiry_date := NOW() + (v_duration_days || ' days')::INTERVAL;
    
    -- Update user profile
    UPDATE public.profiles
    SET 
        subscription_tier = p_plan_type,
        subscription_status = 'active',
        subscription_started_at = NOW(),
        subscription_expires_at = v_expiry_date,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Check if update was successful
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. FUNCTION: Check if User is Free Tier
-- ============================================

CREATE OR REPLACE FUNCTION is_free_user(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_tier TEXT;
    v_status TEXT;
    v_expires TIMESTAMPTZ;
BEGIN
    -- Use provided user_id or current user
    v_user_id := COALESCE(p_user_id, auth.uid());
    
    -- Get subscription info
    SELECT subscription_tier, subscription_status, subscription_expires_at
    INTO v_tier, v_status, v_expires
    FROM public.profiles
    WHERE id = v_user_id;
    
    -- User not found
    IF NOT FOUND THEN
        RETURN TRUE;  -- Treat as free user
    END IF;
    
    -- Check if free tier
    IF v_tier = 'free' THEN
        RETURN TRUE;
    END IF;
    
    -- Check if subscription expired
    IF v_status != 'active' THEN
        RETURN TRUE;
    END IF;
    
    IF v_expires IS NOT NULL AND v_expires < NOW() THEN
        RETURN TRUE;
    END IF;
    
    -- Has active premium subscription
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. UPDATE EXISTING FREE USERS
-- ============================================

-- Ensure all users without explicit subscription are marked as free
UPDATE public.profiles
SET 
    subscription_tier = 'free',
    subscription_status = 'inactive'
WHERE subscription_tier IS NULL
   OR (subscription_tier = 'free' AND subscription_status IS NULL);

-- ============================================
-- 6. ADD INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payment_sessions_plan_type 
ON public.payment_sessions(plan_type);

CREATE INDEX IF NOT EXISTS idx_payment_sessions_user_status 
ON public.payment_sessions(user_id, status);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION activate_subscription IS 'Activate user subscription after successful payment';
COMMENT ON FUNCTION is_free_user IS 'Check if user is on free tier (no active premium subscription)';
COMMENT ON COLUMN public.payment_sessions.plan_type IS 'Subscription plan type: monthly, quarterly, or annual';

