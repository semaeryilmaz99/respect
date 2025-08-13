-- Check Respect Data Sources
-- Bu script respect verilerinin hangi tablolarda saklandığını kontrol eder

-- 1. Respect ile ilgili tüm tabloları bul
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name LIKE '%respect%' 
   OR table_name LIKE '%transaction%'
   OR table_name LIKE '%payment%'
ORDER BY table_name;

-- 2. Respect transactions tablosunun yapısını kontrol et
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'respect_transactions'
ORDER BY ordinal_position;

-- 3. Profiles tablosunda respect ile ilgili alanlar var mı kontrol et
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND (column_name LIKE '%respect%' OR column_name LIKE '%balance%')
ORDER BY ordinal_position;

-- 4. Respect transactions tablosunda veri var mı kontrol et
SELECT COUNT(*) as total_respect_transactions FROM respect_transactions;

-- 5. Profiles tablosunda respect balance'ları kontrol et
SELECT 
  id,
  username,
  respect_balance,
  total_respect_sent,
  total_respect_received
FROM profiles 
WHERE respect_balance > 0 OR total_respect_sent > 0 OR total_respect_received > 0
LIMIT 10;

-- 6. Belirli kullanıcının respect bilgilerini kontrol et
SELECT 
  id,
  username,
  full_name,
  respect_balance,
  total_respect_sent,
  total_respect_received,
  created_at,
  updated_at
FROM profiles 
WHERE id = '846e54a0-6ead-4eb4-a306-011225cfd6c1';

-- 7. Son 10 respect transaction'ını kontrol et (eğer varsa)
SELECT 
  id,
  from_user_id,
  to_artist_id,
  song_id,
  amount,
  created_at
FROM respect_transactions 
ORDER BY created_at DESC
LIMIT 10;
