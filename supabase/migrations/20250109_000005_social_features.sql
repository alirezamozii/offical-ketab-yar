-- ============================================
-- KETAB-YAR: SOCIAL FEATURES SYSTEM
-- ============================================
-- Friends, Playlists, Activity Feed
-- Date: 2025-01-09
-- ============================================

-- ============================================
-- 1. FRIENDSHIPS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Friendship parties
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    
    -- Timestamps
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT no_self_friendship CHECK (user_id != friend_id),
    CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

-- ============================================
-- 2. BOOK PLAYLISTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.book_playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Owner
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Playlist info
    name TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    
    -- Privacy
    is_public BOOLEAN DEFAULT FALSE,
    
    -- Stats (auto-updated by triggers)
    view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
    follower_count INTEGER DEFAULT 0 CHECK (follower_count >= 0),
    book_count INTEGER DEFAULT 0 CHECK (book_count >= 0),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. PLAYLIST BOOKS TABLE (Junction)
-- ============================================

CREATE TABLE IF NOT EXISTS public.playlist_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    playlist_id UUID NOT NULL REFERENCES public.book_playlists(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    
    -- Order
    position INTEGER NOT NULL DEFAULT 0,
    
    -- Optional note
    note TEXT,
    
    -- Timestamp
    added_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_playlist_book UNIQUE (playlist_id, book_id)
);

-- ============================================
-- 4. PLAYLIST FOLLOWERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.playlist_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    playlist_id UUID NOT NULL REFERENCES public.book_playlists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Timestamp
    followed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_playlist_follower UNIQUE (playlist_id, user_id)
);

-- ============================================
-- 5. FRIEND ACTIVITIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.friend_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who did the activity
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Activity type
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'book_started',
        'book_completed',
        'achievement_earned',
        'level_up',
        'streak_milestone',
        'playlist_created',
        'playlist_updated',
        'book_rated',
        'vocabulary_milestone'
    )),
    
    -- Related entities (optional)
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
    achievement_id TEXT, -- Reference to achievement slug
    playlist_id UUID REFERENCES public.book_playlists(id) ON DELETE CASCADE,
    
    -- Additional data
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Friendships
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);
CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON public.friendships(user_id, status);

-- Playlists
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON public.book_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_public ON public.book_playlists(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_playlists_created ON public.book_playlists(created_at DESC);

-- Playlist Books
CREATE INDEX IF NOT EXISTS idx_playlist_books_playlist ON public.playlist_books(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_books_book ON public.playlist_books(book_id);
CREATE INDEX IF NOT EXISTS idx_playlist_books_position ON public.playlist_books(playlist_id, position);

-- Playlist Followers
CREATE INDEX IF NOT EXISTS idx_playlist_followers_playlist ON public.playlist_followers(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_followers_user ON public.playlist_followers(user_id);

-- Friend Activities
CREATE INDEX IF NOT EXISTS idx_activities_user ON public.friend_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.friend_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON public.friend_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_book ON public.friend_activities(book_id) WHERE book_id IS NOT NULL;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update playlist book_count when books added/removed
CREATE OR REPLACE FUNCTION update_playlist_book_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.book_playlists
        SET book_count = book_count + 1,
            updated_at = NOW()
        WHERE id = NEW.playlist_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.book_playlists
        SET book_count = GREATEST(0, book_count - 1),
            updated_at = NOW()
        WHERE id = OLD.playlist_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_playlist_book_count ON public.playlist_books;

CREATE TRIGGER trigger_update_playlist_book_count
    AFTER INSERT OR DELETE ON public.playlist_books
    FOR EACH ROW
    EXECUTE FUNCTION update_playlist_book_count();

-- Update playlist follower_count
CREATE OR REPLACE FUNCTION update_playlist_follower_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.book_playlists
        SET follower_count = follower_count + 1
        WHERE id = NEW.playlist_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.book_playlists
        SET follower_count = GREATEST(0, follower_count - 1)
        WHERE id = OLD.playlist_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_playlist_follower_count ON public.playlist_followers;

CREATE TRIGGER trigger_update_playlist_follower_count
    AFTER INSERT OR DELETE ON public.playlist_followers
    FOR EACH ROW
    EXECUTE FUNCTION update_playlist_follower_count();

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Drop existing functions if they exist (to handle signature changes)
DROP FUNCTION IF EXISTS get_friends(UUID);
DROP FUNCTION IF EXISTS get_friend_requests(UUID);
DROP FUNCTION IF EXISTS get_friend_activity_feed(UUID, INTEGER);

-- Get user's friends with stats
CREATE OR REPLACE FUNCTION get_friends(p_user_id UUID)
RETURNS TABLE (
    friend_id UUID,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    xp INTEGER,
    level INTEGER,
    current_streak INTEGER,
    books_read INTEGER,
    friendship_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.full_name,
        p.avatar_url,
        p.xp,
        p.gamification_level,
        p.current_streak,
        COUNT(DISTINCT up.book_id)::INTEGER as books_read,
        f.responded_at
    FROM public.friendships f
    JOIN public.profiles p ON (
        CASE 
            WHEN f.user_id = p_user_id THEN p.id = f.friend_id
            ELSE p.id = f.user_id
        END
    )
    LEFT JOIN public.user_progress up ON up.user_id = p.id AND up.is_completed = TRUE
    WHERE (f.user_id = p_user_id OR f.friend_id = p_user_id)
        AND f.status = 'accepted'
    GROUP BY p.id, p.username, p.full_name, p.avatar_url, p.xp, p.gamification_level, p.current_streak, f.responded_at
    ORDER BY f.responded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get pending friend requests
CREATE OR REPLACE FUNCTION get_friend_requests(p_user_id UUID)
RETURNS TABLE (
    request_id UUID,
    requester_id UUID,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    xp INTEGER,
    level INTEGER,
    current_streak INTEGER,
    requested_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        p.id,
        p.username,
        p.full_name,
        p.avatar_url,
        p.xp,
        p.gamification_level,
        p.current_streak,
        f.requested_at
    FROM public.friendships f
    JOIN public.profiles p ON p.id = f.user_id
    WHERE f.friend_id = p_user_id
        AND f.status = 'pending'
    ORDER BY f.requested_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get friend activity feed
CREATE OR REPLACE FUNCTION get_friend_activity_feed(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    activity_id UUID,
    user_id UUID,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    activity_type TEXT,
    book_id UUID,
    book_title TEXT,
    book_cover TEXT,
    achievement_id TEXT,
    playlist_id UUID,
    playlist_name TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fa.id,
        p.id,
        p.username,
        p.full_name,
        p.avatar_url,
        fa.activity_type,
        b.id,
        b.title,
        b.cover_url,
        fa.achievement_id,
        pl.id,
        pl.name,
        fa.metadata,
        fa.created_at
    FROM public.friend_activities fa
    JOIN public.profiles p ON p.id = fa.user_id
    LEFT JOIN public.books b ON b.id = fa.book_id
    LEFT JOIN public.book_playlists pl ON pl.id = fa.playlist_id
    WHERE fa.user_id IN (
        SELECT CASE 
            WHEN f.user_id = p_user_id THEN f.friend_id
            ELSE f.user_id
        END
        FROM public.friendships f
        WHERE (f.user_id = p_user_id OR f.friend_id = p_user_id)
            AND f.status = 'accepted'
    )
    ORDER BY fa.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can create friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can update their received requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;

DROP POLICY IF EXISTS "Users can view public playlists" ON public.book_playlists;
DROP POLICY IF EXISTS "Users can create their own playlists" ON public.book_playlists;
DROP POLICY IF EXISTS "Users can update their own playlists" ON public.book_playlists;
DROP POLICY IF EXISTS "Users can delete their own playlists" ON public.book_playlists;

DROP POLICY IF EXISTS "Users can view playlist books if they can see the playlist" ON public.playlist_books;
DROP POLICY IF EXISTS "Users can manage their playlist books" ON public.playlist_books;

DROP POLICY IF EXISTS "Users can view playlist followers" ON public.playlist_followers;
DROP POLICY IF EXISTS "Users can follow playlists" ON public.playlist_followers;
DROP POLICY IF EXISTS "Users can unfollow playlists" ON public.playlist_followers;

DROP POLICY IF EXISTS "Users can view friend activities" ON public.friend_activities;
DROP POLICY IF EXISTS "Users can create their own activities" ON public.friend_activities;

-- Friendships policies
CREATE POLICY "Users can view their own friendships"
    ON public.friendships FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests"
    ON public.friendships FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their received requests"
    ON public.friendships FOR UPDATE
    USING (auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships"
    ON public.friendships FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Playlists policies
CREATE POLICY "Users can view public playlists"
    ON public.book_playlists FOR SELECT
    USING (is_public = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can create their own playlists"
    ON public.book_playlists FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists"
    ON public.book_playlists FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists"
    ON public.book_playlists FOR DELETE
    USING (auth.uid() = user_id);

-- Playlist books policies
CREATE POLICY "Users can view playlist books if they can see the playlist"
    ON public.playlist_books FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.book_playlists
            WHERE id = playlist_id
            AND (is_public = TRUE OR user_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage their playlist books"
    ON public.playlist_books FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.book_playlists
            WHERE id = playlist_id AND user_id = auth.uid()
        )
    );

-- Playlist followers policies
CREATE POLICY "Users can view playlist followers"
    ON public.playlist_followers FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can follow playlists"
    ON public.playlist_followers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow playlists"
    ON public.playlist_followers FOR DELETE
    USING (auth.uid() = user_id);

-- Friend activities policies
CREATE POLICY "Users can view friend activities"
    ON public.friend_activities FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.friendships
            WHERE (user_id = auth.uid() OR friend_id = auth.uid())
            AND (user_id = friend_activities.user_id OR friend_id = friend_activities.user_id)
            AND status = 'accepted'
        )
    );

CREATE POLICY "Users can create their own activities"
    ON public.friend_activities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.friendships IS 'User friendships and friend requests';
COMMENT ON TABLE public.book_playlists IS 'User-created book collections';
COMMENT ON TABLE public.playlist_books IS 'Books in playlists with ordering';
COMMENT ON TABLE public.playlist_followers IS 'Users following playlists';
COMMENT ON TABLE public.friend_activities IS 'Activity feed for friends';

COMMENT ON FUNCTION get_friends IS 'Get user friends with stats';
COMMENT ON FUNCTION get_friend_requests IS 'Get pending friend requests';
COMMENT ON FUNCTION get_friend_activity_feed IS 'Get activity feed from friends';
