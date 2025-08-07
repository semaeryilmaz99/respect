-- Fix get_user_respect_stats function - Data type mismatch
-- This migration fixes the integer/bigint type mismatch in the function

-- Drop the existing function
DROP FUNCTION IF EXISTS get_user_respect_stats(uuid);

-- Recreate the function with correct data types
CREATE OR REPLACE FUNCTION get_user_respect_stats(p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  username text,
  full_name text,
  respect_balance integer,
  total_respect_sent integer,
  total_respect_received integer,
  total_respect_activity integer
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
GRANT EXECUTE ON FUNCTION get_user_respect_stats(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_user_respect_stats(uuid) IS 'Get user respect statistics with correct data types'; 