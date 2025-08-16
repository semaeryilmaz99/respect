-- RLS Politikalarını Manuel Olarak Ekle
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- 1. Artists tablosu için RLS politikası
CREATE POLICY "Users can only see their own artist records" ON artists
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Songs tablosu için RLS politikası  
CREATE POLICY "Users can only see songs from their own artists" ON songs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM artists a 
      WHERE a.id = songs.artist_id 
      AND a.user_id = auth.uid()
    )
  );

-- 3. Mevcut fonksiyonları güncelle
DROP FUNCTION IF EXISTS get_user_artist_songs(UUID);
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
      rt_inner.song_id,
      SUM(rt_inner.amount) as total_respect
    FROM respect_transactions rt_inner
    GROUP BY rt_inner.song_id
  ) rt ON s.id = rt.song_id
  WHERE a.user_id = user_uuid  -- SADECE kullanıcının kendi sanatçı şarkıları
  ORDER BY rt.total_respect DESC NULLS LAST, COALESCE(s.release_date, CURRENT_DATE) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonksiyon izinlerini güncelle
GRANT EXECUTE ON FUNCTION get_user_artist_songs(UUID) TO authenticated;

-- 5. Test için mevcut politikaları kontrol et
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('artists', 'songs');
