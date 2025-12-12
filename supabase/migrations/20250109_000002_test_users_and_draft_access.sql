-- ============================================
-- TEST USERS AND DRAFT ACCESS SYSTEM
-- ============================================
-- Allow test users to access specific draft books
-- Date: 2025-01-09
-- ============================================

-- Note: The role column in profiles table uses TEXT with CHECK constraint,
-- not an ENUM type. The 'test_user' value is already included in the CHECK constraint
-- in the core_tables migration: CHECK (role IN ('user', 'admin', 'test_user'))

-- ============================================
-- DRAFT ACCESS TABLE
-- ============================================

-- Create table for tracking draft access
CREATE TABLE IF NOT EXISTS public.draft_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    book_sanity_id TEXT NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID REFERENCES public.profiles(id),
    UNIQUE(user_id, book_sanity_id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE public.draft_access ENABLE ROW LEVEL SECURITY;

-- Policies for draft_access
CREATE POLICY "Admins can manage draft access"
    ON public.draft_access
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can view their own draft access"
    ON public.draft_access
    FOR SELECT
    USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check if user can access drafts
CREATE OR REPLACE FUNCTION can_access_draft(book_sanity_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Admins can access all drafts
    IF EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    ) THEN
        RETURN TRUE;
    END IF;

    -- Test users can access drafts they're granted access to
    IF EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'test_user'
    ) AND EXISTS (
        SELECT 1 FROM public.draft_access
        WHERE user_id = auth.uid()
        AND draft_access.book_sanity_id = can_access_draft.book_sanity_id
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_draft_access_user_id ON public.draft_access(user_id);
CREATE INDEX IF NOT EXISTS idx_draft_access_book_sanity_id ON public.draft_access(book_sanity_id);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.draft_access IS 'Tracks which test users can access which draft books';
COMMENT ON FUNCTION can_access_draft IS 'Check if current user can access a draft book';
