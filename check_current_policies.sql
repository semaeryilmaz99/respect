-- Mevcut RLS politikalarını kontrol et
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
WHERE tablename IN ('artists', 'songs');

-- Mevcut fonksiyonları kontrol et
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE proname IN ('get_user_artist_songs', 'get_user_playlist_songs');

-- Artists tablosu RLS durumu
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'artists';

-- Songs tablosu RLS durumu
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'songs';
