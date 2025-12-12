-- ============================================
-- KETAB-YAR: FUNCTIONS & TRIGGERS
-- ============================================
-- Automated database functions and triggers
-- Date: 2025-01-01
-- ============================================

-- ============================================
-- 1. UPDATE TIMESTAMP FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at 
  BEFORE UPDATE ON public.books 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_library_updated_at 
  BEFORE UPDATE ON public.user_library 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vocabulary_updated_at 
  BEFORE UPDATE ON public.vocabulary 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at 
  BEFORE UPDATE ON public.reviews 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_sessions_updated_at 
  BEFORE UPDATE ON public.payment_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. UPDATE BOOK RATING FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_book_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.books
  SET 
    rating = (
      SELECT AVG(rating)::DECIMAL(3,2) 
      FROM public.reviews 
      WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)
    ),
    review_count = (
      SELECT COUNT(*) 
      FROM public.reviews 
      WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)
    )
  WHERE id = COALESCE(NEW.book_id, OLD.book_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for book rating
CREATE TRIGGER update_book_rating_on_review 
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews 
  FOR EACH ROW EXECUTE FUNCTION update_book_rating();

-- ============================================
-- 3. UPDATE USER STREAK FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
  -- If last_read_at is yesterday, increment streak
  IF OLD.last_read_at = CURRENT_DATE - INTERVAL '1 day' THEN
    NEW.current_streak = OLD.current_streak + 1;
    NEW.longest_streak = GREATEST(OLD.longest_streak, NEW.current_streak);
  -- If last_read_at is more than 1 day ago, reset streak
  ELSIF OLD.last_read_at < CURRENT_DATE - INTERVAL '1 day' OR OLD.last_read_at IS NULL THEN
    NEW.current_streak = 1;
  -- If last_read_at is today, keep streak
  ELSIF OLD.last_read_at = CURRENT_DATE THEN
    NEW.current_streak = OLD.current_streak;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for streak
CREATE TRIGGER update_streak_on_read 
  BEFORE UPDATE OF last_read_at ON public.profiles 
  FOR EACH ROW 
  WHEN (NEW.last_read_at IS DISTINCT FROM OLD.last_read_at)
  EXECUTE FUNCTION update_user_streak();

-- ============================================
-- 4. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 5. SYNC QUEUE CLEANUP FUNCTION
-- ============================================
-- Automatically delete synced items older than 7 days
CREATE OR REPLACE FUNCTION cleanup_old_sync_queue()
RETURNS void AS $$
BEGIN
  DELETE FROM public.sync_queue
  WHERE synced = TRUE 
    AND synced_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. EXPIRED SUBSCRIPTION CHECKER
-- ============================================
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET subscription_status = 'expired'
  WHERE subscription_status = 'active'
    AND subscription_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at timestamp';
COMMENT ON FUNCTION update_book_rating() IS 'Recalculates book rating when reviews change';
COMMENT ON FUNCTION update_user_streak() IS 'Updates user reading streak based on last_read_at';
COMMENT ON FUNCTION handle_new_user() IS 'Creates profile when new user signs up';
COMMENT ON FUNCTION cleanup_old_sync_queue() IS 'Removes old synced items from queue';
COMMENT ON FUNCTION check_expired_subscriptions() IS 'Marks expired subscriptions';
