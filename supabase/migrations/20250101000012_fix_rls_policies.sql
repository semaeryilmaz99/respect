-- Fix RLS Policies for Spotify Sync Functionality
-- Migration: 20250101000012_fix_rls_policies.sql
-- This migration fixes all RLS policies that were causing 406 errors

-- 1. Fix artist_follows table RLS policies
DROP POLICY IF EXISTS "Users can view all follows" ON artist_follows;
DROP POLICY IF EXISTS "Users can insert own follows" ON artist_follows;
DROP POLICY IF EXISTS "Users can delete own follows" ON artist_follows;
DROP POLICY IF EXISTS "Artist follows are viewable by everyone" ON artist_follows;
DROP POLICY IF EXISTS "Users can manage own follows" ON artist_follows;
DROP POLICY IF EXISTS "Users can update own follows" ON artist_follows;

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

-- 2. Fix spotify_sync_logs table RLS policies
DROP POLICY IF EXISTS "Users can view their own sync logs" ON spotify_sync_logs;
DROP POLICY IF EXISTS "Users can insert their own sync logs" ON spotify_sync_logs;
DROP POLICY IF EXISTS "Users can update their own sync logs" ON spotify_sync_logs;
DROP POLICY IF EXISTS "Users can delete their own sync logs" ON spotify_sync_logs;

CREATE POLICY "Users can view their own sync logs" 
ON spotify_sync_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs" 
ON spotify_sync_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync logs" 
ON spotify_sync_logs FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync logs" 
ON spotify_sync_logs FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Fix spotify_connections table RLS policies
DROP POLICY IF EXISTS "Users can view their own spotify connections" ON spotify_connections;
DROP POLICY IF EXISTS "Users can insert their own spotify connections" ON spotify_connections;
DROP POLICY IF EXISTS "Users can update their own spotify connections" ON spotify_connections;
DROP POLICY IF EXISTS "Users can delete their own spotify connections" ON spotify_connections;

CREATE POLICY "Users can view their own spotify connections" 
ON spotify_connections FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spotify connections" 
ON spotify_connections FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spotify connections" 
ON spotify_connections FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spotify connections" 
ON spotify_connections FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Fix artists table RLS policies
DROP POLICY IF EXISTS "Artists are viewable by everyone" ON artists;
DROP POLICY IF EXISTS "Users can view all artists" ON artists;
DROP POLICY IF EXISTS "Songs are viewable by everyone" ON artists;

CREATE POLICY "Artists are viewable by everyone" 
ON artists FOR SELECT 
USING (true);

-- 5. Fix songs table RLS policies
DROP POLICY IF EXISTS "Songs are viewable by everyone" ON songs;
DROP POLICY IF EXISTS "Users can view all songs" ON songs;

CREATE POLICY "Songs are viewable by everyone" 
ON songs FOR SELECT 
USING (true);

-- 6. Fix song_favorites table RLS policies
DROP POLICY IF EXISTS "Song favorites are viewable by everyone" ON song_favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON song_favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON song_favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON song_favorites;

CREATE POLICY "Song favorites are viewable by everyone" 
ON song_favorites FOR SELECT 
USING (true);

CREATE POLICY "Users can insert own favorites" 
ON song_favorites FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" 
ON song_favorites FOR DELETE 
USING (auth.uid() = user_id);

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

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_artist_follows_user_artist ON artist_follows(user_id, artist_id);
CREATE INDEX IF NOT EXISTS idx_spotify_sync_logs_user_type ON spotify_sync_logs(user_id, sync_type);
CREATE INDEX IF NOT EXISTS idx_spotify_connections_user ON spotify_connections(user_id);

-- 9. Add comments for documentation
COMMENT ON TABLE artist_follows IS 'Artist follow relationships with RLS policies for user privacy';
COMMENT ON TABLE spotify_sync_logs IS 'Spotify sync activity logs with RLS policies for user privacy';
COMMENT ON TABLE spotify_connections IS 'User Spotify connections with RLS policies for user privacy';
