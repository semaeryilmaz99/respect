-- Spotify Integration Tables
-- Migration: 20250101000010_create_spotify_integration_tables.sql

-- Spotify bağlantıları için tablo
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

-- Spotify senkronizasyon logları için tablo
CREATE TABLE IF NOT EXISTS spotify_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('artist_profile', 'artist_songs', 'artist_albums', 'user_top_tracks', 'user_recently_played')),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  items_processed INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mevcut artists tablosuna spotify_id kolonu ekle
ALTER TABLE artists ADD COLUMN IF NOT EXISTS spotify_id TEXT UNIQUE;

-- Mevcut songs tablosuna spotify_id kolonu ekle
ALTER TABLE songs ADD COLUMN IF NOT EXISTS spotify_id TEXT UNIQUE;

-- Albums tablosu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  cover_url TEXT,
  spotify_id TEXT UNIQUE,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  release_date DATE,
  total_tracks INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) politikaları
ALTER TABLE spotify_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotify_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

-- Spotify connections için RLS politikaları
DROP POLICY IF EXISTS "Users can view their own spotify connections" ON spotify_connections;
CREATE POLICY "Users can view their own spotify connections" ON spotify_connections
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own spotify connections" ON spotify_connections;
CREATE POLICY "Users can insert their own spotify connections" ON spotify_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own spotify connections" ON spotify_connections;
CREATE POLICY "Users can update their own spotify connections" ON spotify_connections
  FOR UPDATE USING (auth.uid() = user_id);

-- Spotify sync logs için RLS politikaları
DROP POLICY IF EXISTS "Users can view their own sync logs" ON spotify_sync_logs;
CREATE POLICY "Users can view their own sync logs" ON spotify_sync_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sync logs" ON spotify_sync_logs;
CREATE POLICY "Users can insert their own sync logs" ON spotify_sync_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Albums için RLS politikaları
DROP POLICY IF EXISTS "Anyone can view albums" ON albums;
CREATE POLICY "Anyone can view albums" ON albums
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Artists can insert their own albums" ON albums;
CREATE POLICY "Artists can insert their own albums" ON albums
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM artists 
      WHERE artists.id = albums.artist_id 
      AND artists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Artists can update their own albums" ON albums;
CREATE POLICY "Artists can update their own albums" ON albums
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM artists 
      WHERE artists.id = albums.artist_id 
      AND artists.user_id = auth.uid()
    )
  );

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spotify_connections_user_id ON spotify_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_connections_spotify_user_id ON spotify_connections(spotify_user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_sync_logs_user_id ON spotify_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_sync_logs_created_at ON spotify_sync_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON artists(spotify_id);
CREATE INDEX IF NOT EXISTS idx_songs_spotify_id ON songs(spotify_id);
CREATE INDEX IF NOT EXISTS idx_albums_spotify_id ON albums(spotify_id);
CREATE INDEX IF NOT EXISTS idx_albums_artist_id ON albums(artist_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_spotify_connections_updated_at ON spotify_connections;
CREATE TRIGGER update_spotify_connections_updated_at 
  BEFORE UPDATE ON spotify_connections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_albums_updated_at ON albums;
CREATE TRIGGER update_albums_updated_at 
  BEFORE UPDATE ON albums 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 