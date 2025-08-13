-- Fix Artist Follows RLS Policies - Final Version
-- Bu script artist_follows tablosundaki takip durumu kontrolü sorununu çözer

-- 1. Mevcut politikaları temizle
DROP POLICY IF EXISTS "artist_follows_select_policy" ON artist_follows;
DROP POLICY IF EXISTS "artist_follows_insert_policy" ON artist_follows;
DROP POLICY IF EXISTS "artist_follows_update_policy" ON artist_follows;
DROP POLICY IF EXISTS "artist_follows_delete_policy" ON artist_follows;

-- 2. Yeni, basit ve etkili politikalar oluştur
CREATE POLICY "artist_follows_select_policy"
ON artist_follows FOR SELECT
USING (true); -- Tüm kullanıcılar takip durumlarını görebilir

CREATE POLICY "artist_follows_insert_policy"
ON artist_follows FOR INSERT
WITH CHECK (auth.uid() = user_id); -- Sadece kendi takiplerini ekleyebilir

CREATE POLICY "artist_follows_update_policy"
ON artist_follows FOR UPDATE
USING (auth.uid() = user_id); -- Sadece kendi takiplerini güncelleyebilir

CREATE POLICY "artist_follows_delete_policy"
ON artist_follows FOR DELETE
USING (auth.uid() = user_id); -- Sadece kendi takiplerini silebilir

-- 3. Politikaları doğrula
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'artist_follows'
ORDER BY policyname;

-- 4. Test verisi kontrol et
SELECT COUNT(*) FROM artist_follows LIMIT 1;

-- 5. RLS'nin aktif olduğunu doğrula
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'artist_follows';
