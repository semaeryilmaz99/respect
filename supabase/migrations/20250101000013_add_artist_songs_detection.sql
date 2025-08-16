-- Artist Songs Detection and User Profile Enhancement - FIXED VERSION
-- Migration: 20250101000013_add_artist_songs_detection_fixed.sql

-- Önce mevcut songs tablosunun yapısını kontrol et
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

-- Kullanıcının sanatçı olup olmadığını tespit etmek için view oluştur
CREATE OR REPLACE VIEW user_artist_status AS
SELECT 
  u.id as user_id,
  u.email,
  CASE 
    WHEN a.id IS NOT NULL THEN true 
    ELSE false 
  END as is_artist,
  a.id as artist_id,
  a.name as artist_name,
  a.spotify_id as artist_spotify_id
FROM auth.users u
LEFT JOIN artists a ON u.id = a.user_id;

-- Kullanıcının kendi sanatçı şarkılarını getiren view
CREATE OR REPLACE VIEW user_own_artist_songs AS
SELECT 
  s.id as song_id,
  s.title,
  s.artist_id,
  s.spotify_id as song_spotify_id,
  s.cover_url,
  COALESCE(s.duration, 0) as duration,
  COALESCE(s.release_date, CURRENT_DATE) as release_date,
  a.name as artist_name,
  a.user_id,
  u.email as user_email
FROM songs s
JOIN artists a ON s.artist_id = a.id
JOIN auth.users u ON a.user_id = u.id
WHERE a.user_id IS NOT NULL;

-- Kullanıcının playlist şarkılarını getiren view (sanatçı değilse)
-- Bu view, kullanıcının kendi sanatçı şarkıları olmayan şarkıları gösterir
CREATE OR REPLACE VIEW user_playlist_songs AS
SELECT 
  s.id as song_id,
  s.title,
  s.artist_id,
  s.spotify_id as song_spotify_id,
  s.cover_url,
  COALESCE(s.duration, 0) as duration,
  COALESCE(s.release_date, CURRENT_DATE) as release_date,
  a.name as artist_name,
  current_user_id.user_id,
  current_user_id.user_email
FROM songs s
JOIN artists a ON s.artist_id = a.id
CROSS JOIN (
  SELECT 
    u.id as user_id,
    u.email as user_email
  FROM auth.users u
  JOIN spotify_connections sc ON u.id = sc.user_id
  WHERE u.id = auth.uid()
) current_user_id
WHERE a.user_id != current_user_id.user_id; -- Kullanıcının kendi şarkıları değil

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

-- Kullanıcının sanatçı olup olmadığını kontrol eden fonksiyon
CREATE OR REPLACE FUNCTION is_user_artist(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM artists WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS politikaları için gerekli izinler
GRANT SELECT ON user_artist_status TO authenticated;
GRANT SELECT ON user_own_artist_songs TO authenticated;
GRANT SELECT ON user_playlist_songs TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_artist_songs(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_playlist_songs(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_artist(UUID) TO authenticated;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON artists(user_id);
CREATE INDEX IF NOT EXISTS idx_songs_artist_id ON songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_respect_transactions_song_id ON respect_transactions(song_id);
