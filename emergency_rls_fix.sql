-- EMERGENCY RLS FIX - Run this in Supabase Dashboard SQL Editor
-- This will immediately fix the 406 errors you're experiencing

-- 1. First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('artist_follows', 'spotify_sync_logs', 'spotify_connections');

-- 2. Drop ALL existing policies on artist_follows
DROP POLICY IF EXISTS "Users can view all follows" ON artist_follows;
DROP POLICY IF EXISTS "Users can insert own follows" ON artist_follows;
DROP POLICY IF EXISTS "Users can delete own follows" ON artist_follows;
DROP POLICY IF EXISTS "Artist follows are viewable by everyone" ON artist_follows;
DROP POLICY IF EXISTS "Users can manage own follows" ON artist_follows;
DROP POLICY IF EXISTS "Users can update own follows" ON artist_follows;
DROP POLICY IF EXISTS "Enable read access for all users" ON artist_follows;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON artist_follows;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON artist_follows;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON artist_follows;

-- 3. Create simple, permissive policies for artist_follows
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

-- 4. Drop ALL existing policies on spotify_sync_logs
DROP POLICY IF EXISTS "Users can view their own sync logs" ON spotify_sync_logs;
DROP POLICY IF EXISTS "Users can insert their own sync logs" ON spotify_sync_logs;
DROP POLICY IF EXISTS "Users can update their own sync logs" ON spotify_sync_logs;
DROP POLICY IF EXISTS "Users can delete their own sync logs" ON spotify_sync_logs;
DROP POLICY IF EXISTS "Enable read access for all users" ON spotify_sync_logs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON spotify_sync_logs;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON spotify_sync_logs;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON spotify_sync_logs;

-- 5. Create simple, permissive policies for spotify_sync_logs
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

-- 6. Drop ALL existing policies on spotify_connections
DROP POLICY IF EXISTS "Users can view their own spotify connections" ON spotify_connections;
DROP POLICY IF EXISTS "Users can insert their own spotify connections" ON spotify_connections;
DROP POLICY IF EXISTS "Users can update their own spotify connections" ON spotify_connections;
DROP POLICY IF EXISTS "Users can delete their own spotify connections" ON spotify_connections;
DROP POLICY IF EXISTS "Enable read access for all users" ON spotify_connections;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON spotify_connections;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON spotify_connections;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON spotify_connections;

-- 7. Create simple, permissive policies for spotify_connections
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
