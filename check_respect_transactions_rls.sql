-- Check and Fix Respect Transactions RLS Policies
-- Bu script respect_transactions tablosundaki veri erişim sorununu çözer

-- 1. Mevcut politikaları kontrol et
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'respect_transactions'
ORDER BY policyname;

-- 2. Mevcut politikaları temizle
DROP POLICY IF EXISTS "Users can view their own respect transactions" ON respect_transactions;
DROP POLICY IF EXISTS "Users can view all respect transactions" ON respect_transactions;
DROP POLICY IF EXISTS "Users can insert their own respect transactions" ON respect_transactions;
DROP POLICY IF EXISTS "Users can update their own respect transactions" ON respect_transactions;
DROP POLICY IF EXISTS "Users can delete their own respect transactions" ON respect_transactions;

-- 3. Yeni, basit ve etkili politikalar oluştur
-- SELECT: Kullanıcılar kendi respect işlemlerini görebilir
CREATE POLICY "respect_transactions_select_policy"
ON respect_transactions FOR SELECT
USING (auth.uid() = from_user_id);

-- INSERT: Kullanıcılar kendi respect işlemlerini ekleyebilir
CREATE POLICY "respect_transactions_insert_policy"
ON respect_transactions FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

-- UPDATE: Kullanıcılar kendi respect işlemlerini güncelleyebilir
CREATE POLICY "respect_transactions_update_policy"
ON respect_transactions FOR UPDATE
USING (auth.uid() = from_user_id);

-- DELETE: Kullanıcılar kendi respect işlemlerini silebilir
CREATE POLICY "respect_transactions_delete_policy"
ON respect_transactions FOR DELETE
USING (auth.uid() = from_user_id);

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
WHERE tablename = 'respect_transactions'
ORDER BY policyname;

-- 5. Test verisi kontrol et
SELECT COUNT(*) as total_transactions FROM respect_transactions;

-- 6. Belirli kullanıcının respect işlemlerini kontrol et
SELECT 
  id,
  from_user_id,
  to_artist_id,
  song_id,
  amount,
  created_at
FROM respect_transactions 
WHERE from_user_id = '846e54a0-6ead-4eb4-a306-011225cfd6c1'
ORDER BY created_at DESC
LIMIT 5;

-- 7. RLS'nin aktif olduğunu doğrula
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'respect_transactions';
