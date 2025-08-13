-- Fix Artists Table RLS Policy for Spotify Sync
-- Bu script artists tablosundaki UPDATE politikasını düzeltir

-- 1. Mevcut UPDATE politikasını kaldır
DROP POLICY IF EXISTS "Users can update their own artist profile" ON artists;

-- 2. Yeni, daha esnek UPDATE politikası oluştur
CREATE POLICY "Users can update artist profiles" ON artists
  FOR UPDATE 
  USING (true);  -- Tüm güncellemelere izin ver

-- 3. Alternatif olarak, sadece spotify_id'li kayıtlar için güncelleme izni ver
-- CREATE POLICY "Users can update artist profiles" ON artists
--   FOR UPDATE 
--   USING (spotify_id IS NOT NULL OR auth.uid() = user_id);

-- 4. Politikaları doğrula
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'artists'
ORDER BY policyname;

-- 5. Test: Artists tablosuna yeni kayıt ekleme testi
-- (Bu sadece test amaçlıdır, gerçek veri eklemez)
-- INSERT INTO artists (name, spotify_id, total_respect, followers_count) 
-- VALUES ('Test Artist', 'test_spotify_id_123', 0, 0)
-- ON CONFLICT (spotify_id) DO NOTHING;
