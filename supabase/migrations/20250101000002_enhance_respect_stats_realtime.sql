-- Enhance respect statistics for real-time updates
-- Ensure all necessary columns exist in profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_respect_sent integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_respect_received integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS respect_balance integer DEFAULT 1000;

-- Update existing profiles to have default values
UPDATE public.profiles 
SET 
  total_respect_sent = COALESCE(total_respect_sent, 0),
  total_respect_received = COALESCE(total_respect_received, 0),
  respect_balance = COALESCE(respect_balance, 1000)
WHERE total_respect_sent IS NULL OR total_respect_received IS NULL OR respect_balance IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_total_respect_sent ON profiles(total_respect_sent);
CREATE INDEX IF NOT EXISTS idx_profiles_total_respect_received ON profiles(total_respect_received);
CREATE INDEX IF NOT EXISTS idx_profiles_respect_balance ON profiles(respect_balance);

-- Drop existing view if it exists
DROP VIEW IF EXISTS user_respect_stats;

-- Create a view for user respect statistics
CREATE OR REPLACE VIEW user_respect_stats AS
SELECT 
  p.id as user_id,
  p.username,
  p.full_name,
  p.respect_balance,
  p.total_respect_sent,
  p.total_respect_received,
  COALESCE(p.total_respect_sent, 0) + COALESCE(p.total_respect_received, 0) as total_respect_activity
FROM profiles p;

-- Enable real-time for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Create a function to get user respect statistics
CREATE OR REPLACE FUNCTION get_user_respect_stats(p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  username text,
  full_name text,
  respect_balance integer,
  total_respect_sent integer,
  total_respect_received integer,
  total_respect_activity bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.respect_balance,
    p.total_respect_sent,
    p.total_respect_received,
    COALESCE(p.total_respect_sent, 0) + COALESCE(p.total_respect_received, 0) as total_respect_activity
  FROM profiles p
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON user_respect_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_respect_stats TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.total_respect_sent IS 'Total amount of respect sent by the user';
COMMENT ON COLUMN public.profiles.total_respect_received IS 'Total amount of respect received by the user';
COMMENT ON COLUMN public.profiles.respect_balance IS 'Current respect balance of the user';
COMMENT ON VIEW user_respect_stats IS 'View for user respect statistics with calculated totals'; 