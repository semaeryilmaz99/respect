-- 🧪 SİSTEM SAĞLIĞI TEST DOSYASI
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. 🔍 TABLOLARIN VARLIĞINI KONTROL ET
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('artists', 'songs', 'spotify_connections', 'profiles') 
    THEN '✅ VAR' 
    ELSE '❌ YOK' 
  END as durum
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('artists', 'songs', 'spotify_connections', 'profiles');

-- 2. 🎭 ARTISTS TABLOSU YAPISI
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'artists' 
ORDER BY ordinal_position;

-- 3. 🎵 SONGS TABLOSU YAPISI
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'songs' 
ORDER BY ordinal_position;

-- 4. 🔗 SPOTIFY_CONNECTIONS TABLOSU YAPISI
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'spotify_connections' 
ORDER BY ordinal_position;

-- 5. 👥 PROFILES TABLOSU YAPISI
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 6. 🎯 FONKSİYONLARIN VARLIĞI
SELECT 
  routine_name,
  CASE 
    WHEN routine_name IN ('is_user_artist', 'get_user_artist_songs', 'get_user_playlist_songs') 
    THEN '✅ VAR' 
    ELSE '❌ YOK' 
  END as durum
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('is_user_artist', 'get_user_artist_songs', 'get_user_playlist_songs');

-- 7. 📊 MEVCUT VERİ DURUMU
SELECT 'artists' as tablo, COUNT(*) as kayit_sayisi FROM artists
UNION ALL
SELECT 'songs' as tablo, COUNT(*) as kayit_sayisi FROM songs
UNION ALL
SELECT 'spotify_connections' as tablo, COUNT(*) as kayit_sayisi FROM spotify_connections
UNION ALL
SELECT 'profiles' as tablo, COUNT(*) as kayit_sayisi FROM profiles;

-- 8. 🔍 ARTIST-USER BAĞLANTILARI
SELECT 
  a.id as artist_id,
  a.name as artist_name,
  a.spotify_id,
  a.user_id,
  p.email,
  CASE 
    WHEN a.user_id IS NOT NULL THEN '✅ BAĞLI' 
    ELSE '❌ BAĞLISIZ' 
  END as durum
FROM artists a
LEFT JOIN profiles p ON a.user_id = p.id
ORDER BY a.name;

-- 9. 🎵 SONG-ARTIST BAĞLANTILARI
SELECT 
  s.id as song_id,
  s.title as song_title,
  s.spotify_id as song_spotify_id,
  s.artist_id,
  a.name as artist_name,
  CASE 
    WHEN s.artist_id IS NOT NULL THEN '✅ BAĞLI' 
    ELSE '❌ BAĞLISIZ' 
  END as durum
FROM songs s
LEFT JOIN artists a ON s.artist_id = a.id
ORDER BY s.title
LIMIT 10;

-- 10. 🔗 SPOTIFY BAĞLANTI DURUMU
SELECT 
  sc.id,
  sc.user_id,
  p.email,
  sc.spotify_user_id,
  sc.token_expires_at,
  CASE 
    WHEN sc.token_expires_at > NOW() THEN '✅ AKTIF' 
    ELSE '❌ SÜRESİ DOLMUŞ' 
  END as token_durumu
FROM spotify_connections sc
LEFT JOIN profiles p ON sc.user_id = p.id
ORDER BY sc.created_at DESC;
