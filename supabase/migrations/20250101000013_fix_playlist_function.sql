-- Fix get_user_playlist_songs function
-- Migration: 20250101000013_fix_playlist_function.sql

-- Önce eski fonksiyonu silelim
DROP FUNCTION IF EXISTS get_user_playlist_songs(UUID);

-- Doğru playlist fonksiyonunu oluşturalım
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
  -- Bu fonksiyon şimdilik boş döndürüyor çünkü playlist verileri
  -- henüz veritabanında saklanmıyor. Spotify'dan gerçek zamanlı çekiliyor.
  -- Gelecekte playlist verileri için ayrı tablo oluşturulabilir.
  
  RETURN QUERY
  SELECT 
    gen_random_uuid()::UUID as song_id,
    'Playlist şarkıları henüz yüklenmedi'::TEXT as title,
    NULL::UUID as artist_id,
    NULL::TEXT as song_spotify_id,
    NULL::TEXT as cover_url,
    0::INTEGER as duration,
    CURRENT_DATE::DATE as release_date,
    'Spotify Playlist'::TEXT as artist_name,
    0::BIGINT as total_respect
  WHERE false; -- Hiçbir sonuç döndürme
  
  -- Alternatif olarak, kullanıcının favori şarkılarını döndürebiliriz
  -- RETURN QUERY
  -- SELECT 
  --   s.id,
  --   s.title,
  --   s.artist_id,
  --   s.spotify_id,
  --   s.cover_url,
  --   COALESCE(s.duration, 0) as duration,
  --   COALESCE(s.release_date, CURRENT_DATE) as release_date,
  --   a.name,
  --   COALESCE(rt.total_respect, 0) as total_respect
  -- FROM songs s
  -- JOIN artists a ON s.artist_id = a.id
  -- JOIN song_favorites sf ON s.id = sf.song_id
  -- LEFT JOIN (
  --   SELECT 
  --     song_id,
  --     SUM(amount) as total_respect
  --   FROM respect_transactions
  --   GROUP BY song_id
  -- ) rt ON s.id = rt.song_id
  -- WHERE sf.user_id = user_uuid
  -- ORDER BY sf.created_at DESC
  -- LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonksiyon izinlerini güncelle
GRANT EXECUTE ON FUNCTION get_user_playlist_songs(UUID) TO authenticated;
