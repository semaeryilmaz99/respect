-- Artist Songs Detection and User Profile Enhancement - SIMPLE VERSION
-- Migration: 20250101000013_add_artist_songs_detection_simple.sql

-- Önce mevcut songs tablosunun yapısını kontrol et ve eksik kolonları ekle
DO $$
BEGIN
    -- duration kolonu yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'songs' AND column_name = 'duration') THEN
        ALTER TABLE songs ADD COLUMN duration INTEGER DEFAULT 0;
    END IF;
    
    -- release_date kolonu yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'songs' AND column_name = 'release_date') THEN
        ALTER TABLE songs ADD COLUMN release_date DATE DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- Kullanıcının sanatçı olup olmadığını kontrol eden fonksiyon
CREATE OR REPLACE FUNCTION is_user_artist(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM artists WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sanatçı şarkılarını getiren fonksiyon
CREATE OR REPLACE FUNCTION get_user_artist_songs(user_uuid UUID)
RETURNS TABLE (
  song_id UUID,
  title TEXT,
  artist_id UUID,
  song_spotify_id TEXT,
  cover_url TEXT,
  duration INTEGER,
  release_date DATE,
  artist_name TEXT,
  total_respect BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.artist_id,
    s.spotify_id,
    s.cover_url,
    COALESCE(s.duration, 0) as duration,
    COALESCE(s.release_date, CURRENT_DATE) as release_date,
    a.name,
    COALESCE(rt.total_respect, 0) as total_respect
  FROM songs s
  JOIN artists a ON s.artist_id = a.id
  LEFT JOIN (
    SELECT 
      song_id,
      SUM(amount) as total_respect
    FROM respect_transactions
    GROUP BY song_id
  ) rt ON s.id = rt.song_id
  WHERE a.user_id = user_uuid
  ORDER BY rt.total_respect DESC NULLS LAST, COALESCE(s.release_date, CURRENT_DATE) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcının playlist şarkılarını getiren fonksiyon
CREATE OR REPLACE FUNCTION get_user_playlist_songs(user_uuid UUID)
RETURNS TABLE (
  song_id UUID,
  title TEXT,
  artist_id UUID,
  song_spotify_id TEXT,
  cover_url TEXT,
  duration INTEGER,
  release_date DATE,
  artist_name TEXT,
  total_respect BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.artist_id,
    s.spotify_id,
    s.cover_url,
    COALESCE(s.duration, 0) as duration,
    COALESCE(s.release_date, CURRENT_DATE) as release_date,
    a.name,
    COALESCE(rt.total_respect, 0) as total_respect
  FROM songs s
  JOIN artists a ON s.artist_id = a.id
  LEFT JOIN (
    SELECT 
      song_id,
      SUM(amount) as total_respect
    FROM respect_transactions
    GROUP BY song_id
  ) rt ON s.id = rt.song_id
  WHERE a.user_id != user_uuid
  ORDER BY rt.total_respect DESC NULLS LAST, COALESCE(s.release_date, CURRENT_DATE) DESC
  LIMIT 20; -- Playlist şarkıları için limit
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS politikaları için gerekli izinler
GRANT EXECUTE ON FUNCTION get_user_artist_songs(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_playlist_songs(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_artist(UUID) TO authenticated;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON artists(user_id);
CREATE INDEX IF NOT EXISTS idx_songs_artist_id ON songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_respect_transactions_song_id ON respect_transactions(song_id);
