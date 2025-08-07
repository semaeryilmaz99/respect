-- Add function to get respect statistics summary
CREATE OR REPLACE FUNCTION get_respect_stats_summary()
RETURNS TABLE (
  total_users bigint,
  total_respect_sent bigint,
  total_respect_received bigint,
  total_respect_balance bigint,
  avg_respect_per_user numeric,
  top_respect_sender_id uuid,
  top_respect_sender_name text,
  top_respect_sender_amount bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_users,
    COALESCE(SUM(total_respect_sent), 0) as total_respect_sent,
    COALESCE(SUM(total_respect_received), 0) as total_respect_received,
    COALESCE(SUM(respect_balance), 0) as total_respect_balance,
    COALESCE(AVG(total_respect_sent), 0) as avg_respect_per_user,
    top_sender.id as top_respect_sender_id,
    top_sender.full_name as top_respect_sender_name,
    top_sender.total_respect_sent as top_respect_sender_amount
  FROM profiles p
  LEFT JOIN LATERAL (
    SELECT id, full_name, total_respect_sent
    FROM profiles
    WHERE total_respect_sent > 0
    ORDER BY total_respect_sent DESC
    LIMIT 1
  ) top_sender ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_respect_stats_summary() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_respect_stats_summary() IS 'Get overall respect statistics summary for the platform'; 