-- Spotify Playlists Integration Tables
-- Migration: 20250101000011_create_spotify_playlists_tables.sql

-- Spotify çalma listeleri için ana tablo
CREATE TABLE IF NOT EXISTS spotify_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_playlist_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN DEFAULT false,
  is_collaborative BOOLEAN DEFAULT false,
  total_tracks INTEGER DEFAULT 0,
  spotify_owner_id TEXT,
  spotify_owner_name TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spotify çalma listesi şarkıları için tablo
CREATE TABLE IF NOT EXISTS spotify_playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES spotify_playlists(id) ON DELETE CASCADE,
  spotify_track_id TEXT NOT NULL,
  track_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_name TEXT,
  duration_ms INTEGER,
  cover_url TEXT,
  added_at TIMESTAMP WITH TIME ZONE,
  position INTEGER,
  spotify_artist_id TEXT,
  spotify_album_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate tracks in same playlist
  UNIQUE(playlist_id, spotify_track_id)
);

-- Kullanıcı çalma listesi tercihleri için tablo
CREATE TABLE IF NOT EXISTS user_playlist_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id UUID REFERENCES spotify_playlists(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate preferences
  UNIQUE(user_id, playlist_id)
);

-- RLS (Row Level Security) politikaları
ALTER TABLE spotify_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotify_playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_playlist_preferences ENABLE ROW LEVEL SECURITY;

-- Spotify playlists için RLS politikaları
DROP POLICY IF EXISTS "Users can view their own playlists" ON spotify_playlists;
CREATE POLICY "Users can view their own playlists" ON spotify_playlists
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own playlists" ON spotify_playlists;
CREATE POLICY "Users can insert their own playlists" ON spotify_playlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own playlists" ON spotify_playlists;
CREATE POLICY "Users can update their own playlists" ON spotify_playlists
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own playlists" ON spotify_playlists;
CREATE POLICY "Users can delete their own playlists" ON spotify_playlists
  FOR DELETE USING (auth.uid() = user_id);

-- Spotify playlist tracks için RLS politikaları
DROP POLICY IF EXISTS "Users can view their playlist tracks" ON spotify_playlist_tracks;
CREATE POLICY "Users can view their playlist tracks" ON spotify_playlist_tracks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM spotify_playlists 
      WHERE spotify_playlists.id = spotify_playlist_tracks.playlist_id 
      AND spotify_playlists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their playlist tracks" ON spotify_playlist_tracks;
CREATE POLICY "Users can insert their playlist tracks" ON spotify_playlist_tracks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM spotify_playlists 
      WHERE spotify_playlists.id = spotify_playlist_tracks.playlist_id 
      AND spotify_playlists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their playlist tracks" ON spotify_playlist_tracks;
CREATE POLICY "Users can update their playlist tracks" ON spotify_playlist_tracks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM spotify_playlists 
      WHERE spotify_playlists.id = spotify_playlist_tracks.playlist_id 
      AND spotify_playlists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their playlist tracks" ON spotify_playlist_tracks;
CREATE POLICY "Users can delete their playlist tracks" ON spotify_playlist_tracks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM spotify_playlists 
      WHERE spotify_playlists.id = spotify_playlist_tracks.playlist_id 
      AND spotify_playlists.user_id = auth.uid()
    )
  );

-- User playlist preferences için RLS politikaları
DROP POLICY IF EXISTS "Users can view their playlist preferences" ON user_playlist_preferences;
CREATE POLICY "Users can view their playlist preferences" ON user_playlist_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their playlist preferences" ON user_playlist_preferences;
CREATE POLICY "Users can insert their playlist preferences" ON user_playlist_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their playlist preferences" ON user_playlist_preferences;
CREATE POLICY "Users can update their playlist preferences" ON user_playlist_preferences
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their playlist preferences" ON user_playlist_preferences;
CREATE POLICY "Users can delete their playlist preferences" ON user_playlist_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spotify_playlists_user_id ON spotify_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_playlists_spotify_id ON spotify_playlists(spotify_playlist_id);
CREATE INDEX IF NOT EXISTS idx_spotify_playlists_last_synced ON spotify_playlists(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_spotify_playlist_tracks_playlist_id ON spotify_playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_spotify_playlist_tracks_spotify_track_id ON spotify_playlist_tracks(spotify_track_id);
CREATE INDEX IF NOT EXISTS idx_spotify_playlist_tracks_position ON spotify_playlist_tracks(playlist_id, position);
CREATE INDEX IF NOT EXISTS idx_user_playlist_preferences_user_id ON user_playlist_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_playlist_preferences_playlist_id ON user_playlist_preferences(playlist_id);

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_spotify_playlists_updated_at ON spotify_playlists;
CREATE TRIGGER update_spotify_playlists_updated_at 
  BEFORE UPDATE ON spotify_playlists 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_spotify_playlist_tracks_updated_at ON spotify_playlist_tracks;
CREATE TRIGGER update_spotify_playlist_tracks_updated_at 
  BEFORE UPDATE ON spotify_playlist_tracks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_playlist_preferences_updated_at ON user_playlist_preferences;
CREATE TRIGGER update_user_playlist_preferences_updated_at 
  BEFORE UPDATE ON user_playlist_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Spotify sync logs tablosuna playlist sync type'ı ekle
ALTER TABLE spotify_sync_logs 
DROP CONSTRAINT IF EXISTS spotify_sync_logs_sync_type_check;

ALTER TABLE spotify_sync_logs 
ADD CONSTRAINT spotify_sync_logs_sync_type_check 
CHECK (sync_type IN ('artist_profile', 'artist_songs', 'artist_albums', 'user_top_tracks', 'user_recently_played', 'user_playlists', 'playlist_tracks'));
