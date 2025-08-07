-- Enable real-time subscriptions for profiles table
-- This will allow real-time updates when respect data changes

-- Check if profiles table is already in the realtime publication
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'profiles';

-- Add profiles table to realtime publication if not already added
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Verify the table is now in the publication
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'profiles';

-- Check if realtime is enabled for the project
SELECT 
    name,
    value
FROM pg_settings 
WHERE name LIKE '%realtime%';

-- Show current realtime configuration
SELECT 
    'Realtime Status' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'profiles'
        ) 
        THEN 'ENABLED' 
        ELSE 'DISABLED' 
    END as status; 