-- Fix Artist Follows RLS Policies - Optimized Version
-- Bu script artist_follows tablosundaki 406 hatalarını çözer

-- 1. Mevcut politikaları temizle
DROP POLICY IF EXISTS "artist_follows_select_policy" ON artist_follows;
DROP POLICY IF EXISTS "artist_follows_insert_policy" ON artist_follows;
DROP POLICY IF EXISTS "artist_follows_update_policy" ON artist_follows;
DROP POLICY IF EXISTS "artist_follows_delete_policy" ON artist_follows;

-- 2. Yeni, optimize edilmiş politikalar oluştur
-- SELECT: Tüm kullanıcılar takip durumlarını görebilir (toplu sorgu için)
CREATE POLICY "artist_follows_select_policy"
ON artist_follows FOR SELECT
USING (true);

-- INSERT: Sadece kendi takiplerini ekleyebilir
CREATE POLICY "artist_follows_insert_policy"
ON artist_follows FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Sadece kendi takiplerini güncelleyebilir
CREATE POLICY "artist_follows_update_policy"
ON artist_follows FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE: Sadece kendi takiplerini silebilir
CREATE POLICY "artist_follows_delete_policy"
ON artist_follows FOR DELETE
USING (auth.uid() = user_id);

-- 3. Performans için index ekle
CREATE INDEX IF NOT EXISTS idx_artist_follows_user_artist_optimized 
ON artist_follows(user_id, artist_id);

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
WHERE tablename = 'artist_follows'
ORDER BY policyname;

-- 5. Test verisi kontrol et
SELECT COUNT(*) as total_follows FROM artist_follows;

-- 6. RLS'nin aktif olduğunu doğrula
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'artist_follows';
