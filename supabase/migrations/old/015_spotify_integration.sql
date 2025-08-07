-- Spotify Integration Database Schema Updates
-- Run this migration to add Spotify support to your database

-- 1. Add Spotify ID columns to existing tables
ALTER TABLE artists ADD COLUMN IF NOT EXISTS spotify_id TEXT UNIQUE;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS spotify_id TEXT UNIQUE;
ALTER TABLE albums ADD COLUMN IF NOT EXISTS spotify_id TEXT UNIQUE;

-- 2. Create Spotify connections table
CREATE TABLE IF NOT EXISTS spotify_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  spotify_user_id TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Spotify sync logs table
CREATE TABLE IF NOT EXISTS spotify_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'artist_profile', 'artist_songs', 'artist_albums'
  status TEXT NOT NULL, -- 'success', 'error', 'partial'
  items_processed INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spotify_connections_user_id ON spotify_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_connections_spotify_user_id ON spotify_connections(spotify_user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_sync_logs_user_id ON spotify_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_sync_logs_created_at ON spotify_sync_logs(created_at);

-- 5. Create RLS policies for spotify_connections
ALTER TABLE spotify_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own spotify connections" ON spotify_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spotify connections" ON spotify_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spotify connections" ON spotify_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spotify connections" ON spotify_connections
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Create RLS policies for spotify_sync_logs
ALTER TABLE spotify_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync logs" ON spotify_sync_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs" ON spotify_sync_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create trigger for spotify_connections updated_at
CREATE TRIGGER update_spotify_connections_updated_at 
  BEFORE UPDATE ON spotify_connections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Add comments for documentation
COMMENT ON TABLE spotify_connections IS 'Stores Spotify OAuth connections for users';
COMMENT ON TABLE spotify_sync_logs IS 'Logs Spotify data synchronization activities';
COMMENT ON COLUMN artists.spotify_id IS 'Spotify artist ID for external reference';
COMMENT ON COLUMN songs.spotify_id IS 'Spotify track ID for external reference';
COMMENT ON COLUMN albums.spotify_id IS 'Spotify album ID for external reference'; 