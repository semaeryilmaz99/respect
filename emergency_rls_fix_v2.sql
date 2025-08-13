-- EMERGENCY RLS FIX V2 - Run this in Supabase Dashboard SQL Editor
-- This will completely reset all RLS policies and fix the 406 errors

-- 1. First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('artist_follows', 'spotify_sync_logs', 'spotify_connections');

-- 2. Drop ALL existing policies on artist_follows (using wildcard)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'artist_follows'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON artist_follows';
    END LOOP;
END $$;

-- 3. Drop ALL existing policies on spotify_sync_logs
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'spotify_sync_logs'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON spotify_sync_logs';
    END LOOP;
END $$;

-- 4. Drop ALL existing policies on spotify_connections
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'spotify_connections'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON spotify_connections';
    END LOOP;
END $$;

-- 5. Create new policies for artist_follows
CREATE POLICY "artist_follows_select_policy" 
ON artist_follows FOR SELECT 
USING (true);

CREATE POLICY "artist_follows_insert_policy" 
ON artist_follows FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "artist_follows_update_policy" 
ON artist_follows FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "artist_follows_delete_policy" 
ON artist_follows FOR DELETE 
USING (auth.uid() = user_id);

-- 6. Create new policies for spotify_sync_logs
CREATE POLICY "spotify_sync_logs_select_policy" 
ON spotify_sync_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "spotify_sync_logs_insert_policy" 
ON spotify_sync_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "spotify_sync_logs_update_policy" 
ON spotify_sync_logs FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "spotify_sync_logs_delete_policy" 
ON spotify_sync_logs FOR DELETE 
USING (auth.uid() = user_id);

-- 7. Create new policies for spotify_connections
CREATE POLICY "spotify_connections_select_policy" 
ON spotify_connections FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "spotify_connections_insert_policy" 
ON spotify_connections FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "spotify_connections_update_policy" 
ON spotify_connections FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "spotify_connections_delete_policy" 
ON spotify_connections FOR DELETE 
USING (auth.uid() = user_id);

-- 8. Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('artist_follows', 'spotify_sync_logs', 'spotify_connections')
ORDER BY tablename, policyname;

-- 9. Test the policies work
SELECT 'artist_follows policies created successfully' as status;
SELECT 'spotify_sync_logs policies created successfully' as status;
SELECT 'spotify_connections policies created successfully' as status;
