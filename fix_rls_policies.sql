-- Fix RLS Policies for Spotify Sync Functionality
-- This script fixes the 406 "Not Acceptable" errors

-- 1. Fix artist_follows table RLS policies
DROP POLICY IF EXISTS "Users can view all follows" ON artist_follows;
DROP POLICY IF EXISTS "Users can insert own follows" ON artist_follows;
DROP POLICY IF EXISTS "Users can delete own follows" ON artist_follows;
DROP POLICY IF EXISTS "Artist follows are viewable by everyone" ON artist_follows;
DROP POLICY IF EXISTS "Users can manage own follows" ON artist_follows;

-- Create new policies for artist_follows
CREATE POLICY "Artist follows are viewable by everyone" 
ON artist_follows FOR SELECT 
USING (true);

CREATE POLICY "Users can insert own follows" 
ON artist_follows FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own follows" 
ON artist_follows FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own follows" 
ON artist_follows FOR UPDATE 
USING (auth.uid() = user_id);

-- 2. Fix artists table RLS policies (if they exist)
DROP POLICY IF EXISTS "Artists are viewable by everyone" ON artists;
DROP POLICY IF EXISTS "Users can view all artists" ON artists;

CREATE POLICY "Artists are viewable by everyone" 
ON artists FOR SELECT 
USING (true);

-- 3. Fix songs table RLS policies (if they exist)
DROP POLICY IF EXISTS "Songs are viewable by everyone" ON songs;
DROP POLICY IF EXISTS "Users can view all songs" ON songs;

CREATE POLICY "Songs are viewable by everyone" 
ON songs FOR SELECT 
USING (true);

-- 4. Fix song_favorites table RLS policies
DROP POLICY IF EXISTS "Song favorites are viewable by everyone" ON song_favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON song_favorites;

CREATE POLICY "Song favorites are viewable by everyone" 
ON song_favorites FOR SELECT 
USING (true);

CREATE POLICY "Users can insert own favorites" 
ON song_favorites FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" 
ON song_favorites FOR DELETE 
USING (auth.uid() = user_id);

-- 5. Fix spotify_connections table RLS policies
DROP POLICY IF EXISTS "Users can view their own spotify connections" ON spotify_connections;
DROP POLICY IF EXISTS "Users can insert their own spotify connections" ON spotify_connections;
DROP POLICY IF EXISTS "Users can update their own spotify connections" ON spotify_connections;

CREATE POLICY "Users can view their own spotify connections" 
ON spotify_connections FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spotify connections" 
ON spotify_connections FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spotify connections" 
ON spotify_connections FOR UPDATE 
USING (auth.uid() = user_id);

-- 6. Fix spotify_sync_logs table RLS policies
DROP POLICY IF EXISTS "Users can view their own sync logs" ON spotify_sync_logs;
DROP POLICY IF EXISTS "Users can insert their own sync logs" ON spotify_sync_logs;

CREATE POLICY "Users can view their own sync logs" 
ON spotify_sync_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs" 
ON spotify_sync_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 7. Fix profiles table RLS policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 8. Verify all policies are working
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename IN ('artist_follows', 'artists', 'songs', 'song_favorites', 'spotify_connections', 'spotify_sync_logs', 'profiles')
ORDER BY tablename, policyname;

-- 9. Test queries to ensure policies work
-- These should work for authenticated users
SELECT COUNT(*) FROM artist_follows LIMIT 1;
SELECT COUNT(*) FROM artists LIMIT 1;
SELECT COUNT(*) FROM songs LIMIT 1;
SELECT COUNT(*) FROM song_favorites LIMIT 1;
