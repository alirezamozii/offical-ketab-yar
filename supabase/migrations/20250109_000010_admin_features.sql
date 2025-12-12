-- ============================================
-- ADMIN PANEL FEATURES
-- API Keys, Analytics, Settings
-- ============================================

-- API Keys Table (for Gemini rotation)
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    key_value TEXT NOT NULL,
    service TEXT NOT NULL DEFAULT 'gemini', -- gemini, openai, etc
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    error_count INTEGER DEFAULT 0,
    last_error_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Settings Table
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- page_view, book_read, signup, etc
    user_id UUID REFERENCES auth.users(id),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_service ON public.api_keys(service);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON public.api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events(created_at);

-- RLS Policies (admin only)
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Only admins can access API keys
CREATE POLICY "Admins can manage API keys"
    ON public.api_keys
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings"
    ON public.admin_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Anyone can create analytics events, only admins can read
CREATE POLICY "Anyone can create analytics events"
    ON public.analytics_events
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admins can read analytics events"
    ON public.analytics_events
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Function to get next available API key
CREATE OR REPLACE FUNCTION get_next_api_key(service_name TEXT DEFAULT 'gemini')
RETURNS TABLE (
    id UUID,
    key_value TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        api_keys.id,
        api_keys.key_value
    FROM public.api_keys
    WHERE 
        api_keys.service = service_name
        AND api_keys.is_active = true
    ORDER BY 
        api_keys.error_count ASC,
        api_keys.usage_count ASC,
        api_keys.last_used_at ASC NULLS FIRST
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record API key usage
CREATE OR REPLACE FUNCTION record_api_key_usage(
    key_id UUID,
    success BOOLEAN DEFAULT true
)
RETURNS VOID AS $$
BEGIN
    IF success THEN
        UPDATE public.api_keys
        SET 
            usage_count = usage_count + 1,
            last_used_at = NOW(),
            updated_at = NOW()
        WHERE id = key_id;
    ELSE
        UPDATE public.api_keys
        SET 
            error_count = error_count + 1,
            last_error_at = NOW(),
            updated_at = NOW()
        WHERE id = key_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default settings
INSERT INTO public.admin_settings (key, value, description) VALUES
    ('site_maintenance', '{"enabled": false, "message": ""}', 'Site maintenance mode'),
    ('registration_enabled', '{"enabled": true}', 'Allow new user registrations'),
    ('max_free_books', '{"count": 3}', 'Number of free books for non-premium users'),
    ('vocabulary_limit_free', '{"count": 20}', 'Vocabulary word limit for free users')
ON CONFLICT (key) DO NOTHING;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_next_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION record_api_key_usage TO authenticated;
