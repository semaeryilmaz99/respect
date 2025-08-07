-- Enable real-time subscriptions for profiles table
-- This migration ensures that the profiles table is included in the realtime publication
-- so that respect statistics updates are broadcast in real-time

-- Add profiles table to realtime publication (only if not already added)
-- This allows real-time updates when respect_balance, total_respect_sent, or total_respect_received changes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
    END IF;
END $$;

-- Verify the table is now in the publication
-- This query should return a row if the table is successfully added
SELECT 
    'Profiles table added to realtime publication' as status,
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'profiles';

-- Add comment for documentation
COMMENT ON TABLE profiles IS 'User profiles with real-time respect statistics enabled'; 