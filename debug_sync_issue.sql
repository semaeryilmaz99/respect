-- Debug Spotify Sync Issue
-- Bu script sync işleminin gerçekten çalışıp çalışmadığını kontrol eder

-- 1. Son sync loglarını kontrol et
SELECT 
  id,
  user_id,
  sync_type,
  status,
  items_processed,
  items_failed,
  error_message,
  created_at
FROM spotify_sync_logs 
WHERE sync_type = 'user_playlist_data'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Spotify bağlantılarını kontrol et
SELECT 
  user_id,
  spotify_user_id,
  created_at,
  updated_at
FROM spotify_connections
ORDER BY created_at DESC
LIMIT 5;

-- 3. Artists tablosundaki spotify_id'li kayıtları kontrol et
SELECT 
  id,
  name,
  spotify_id,
  total_respect,
  followers_count,
  created_at
FROM artists 
WHERE spotify_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 4. Songs tablosundaki spotify_id'li kayıtları kontrol et
SELECT 
  s.id,
  s.title,
  s.spotify_id,
  s.artist_id,
  a.name as artist_name,
  s.total_respect,
  s.created_at
FROM songs s
LEFT JOIN artists a ON s.artist_id = a.id
WHERE s.spotify_id IS NOT NULL
ORDER BY s.created_at DESC
LIMIT 10;

-- 5. Toplam kayıt sayılarını kontrol et
SELECT 
  'artists' as table_name,
  COUNT(*) as total_records,
  COUNT(spotify_id) as spotify_records
FROM artists
UNION ALL
SELECT 
  'songs' as table_name,
  COUNT(*) as total_records,
  COUNT(spotify_id) as spotify_records
FROM songs;

-- 6. RLS politikalarını kontrol et
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('artists', 'songs', 'spotify_sync_logs')
ORDER BY tablename, policyname;
