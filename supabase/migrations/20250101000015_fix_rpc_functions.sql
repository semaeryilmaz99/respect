-- Fix RPC Functions for Artist Songs System
-- Migration: 20250101000015_fix_rpc_functions.sql

-- 1. Önce eski fonksiyonları silelim
DROP FUNCTION IF EXISTS is_user_artist(UUID);
DROP FUNCTION IF EXISTS get_user_artist_songs(UUID);
DROP FUNCTION IF EXISTS get_user_playlist_songs(UUID);

-- 2. is_user_artist fonksiyonunu yeniden oluştur
CREATE OR REPLACE FUNCTION is_user_artist(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Debug log
  RAISE NOTICE 'Checking if user % is artist', user_uuid;
  
  -- Kullanıcının sanatçı olup olmadığını kontrol et
  RETURN EXISTS (
    SELECT 1 FROM artists 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. get_user_artist_songs fonksiyonunu yeniden oluştur
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
  -- Debug log
  RAISE NOTICE 'Getting artist songs for user %', user_uuid;
  
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
      rt_inner.song_id,
      SUM(rt_inner.amount) as total_respect
    FROM respect_transactions rt_inner
    GROUP BY rt_inner.song_id
  ) rt ON s.id = rt.song_id
  WHERE a.user_id = user_uuid
  ORDER BY rt.total_respect DESC NULLS LAST, COALESCE(s.release_date, CURRENT_DATE) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. get_user_playlist_songs fonksiyonunu yeniden oluştur
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
  -- Debug log
  RAISE NOTICE 'Getting playlist songs for user %', user_uuid;
  
  -- Bu fonksiyon şimdilik boş döndürüyor çünkü playlist verileri
  -- henüz veritabanında saklanmıyor. Spotify'dan gerçek zamanlı çekiliyor.
  
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fonksiyon izinlerini güncelle
GRANT EXECUTE ON FUNCTION is_user_artist(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_artist_songs(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_playlist_songs(UUID) TO authenticated;

-- 6. Fonksiyonları test et
DO $$
BEGIN
  RAISE NOTICE 'Testing RPC functions...';
  
  -- Test is_user_artist function
  BEGIN
    PERFORM is_user_artist('00000000-0000-0000-0000-000000000000'::UUID);
    RAISE NOTICE '✅ is_user_artist function works';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ is_user_artist function error: %', SQLERRM;
  END;
  
  -- Test get_user_artist_songs function
  BEGIN
    PERFORM get_user_artist_songs('00000000-0000-0000-0000-000000000000'::UUID);
    RAISE NOTICE '✅ get_user_artist_songs function works';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ get_user_artist_songs function error: %', SQLERRM;
  END;
  
  -- Test get_user_playlist_songs function
  BEGIN
    PERFORM get_user_playlist_songs('00000000-0000-0000-0000-000000000000'::UUID);
    RAISE NOTICE '✅ get_user_playlist_songs function works';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ get_user_playlist_songs function error: %', SQLERRM;
  END;
  
END $$;
