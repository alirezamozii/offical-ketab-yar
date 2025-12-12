-- Add email column to profiles table for email uniqueness validation
-- This allows us to check email availability before signup

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Add comment
COMMENT ON COLUMN public.profiles.email IS 'User email address (synced from auth.users)';

-- Create function to sync email from auth.users to profiles
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile email when user email changes in auth.users
  UPDATE public.profiles
  SET email = NEW.email,
      updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync email
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_email();

-- Backfill existing users' emails
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
