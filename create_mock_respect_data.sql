-- Create Mock Respect Data for Testing
-- Bu script test için örnek respect transaction'ları oluşturur

-- 1. Önce mevcut test verilerini temizle (isteğe bağlı)
-- DELETE FROM respect_transactions WHERE from_user_id = '846e54a0-6ead-4eb4-a306-011225cfd6c1';

-- 2. Test için örnek respect transaction'ları oluştur
INSERT INTO respect_transactions (
  id,
  from_user_id,
  to_artist_id,
  song_id,
  amount,
  message,
  created_at,
  updated_at
) VALUES 
-- Artist'e gönderilen respect'ler
(
  gen_random_uuid(),
  '846e54a0-6ead-4eb4-a306-011225cfd6c1',
  '550e8400-e29b-41d4-a716-446655440000', -- Örnek artist ID
  NULL,
  50,
  'Harika müzik!',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
),
(
  gen_random_uuid(),
  '846e54a0-6ead-4eb4-a306-011225cfd6c1',
  '550e8400-e29b-41d4-a716-446655440001', -- Örnek artist ID
  NULL,
  100,
  'Muhteşem!',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
(
  gen_random_uuid(),
  '846e54a0-6ead-4eb4-a306-011225cfd6c1',
  '550e8400-e29b-41d4-a716-446655440002', -- Örnek artist ID
  NULL,
  75,
  'Çok beğendim!',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
),
-- Şarkıya gönderilen respect'ler
(
  gen_random_uuid(),
  '846e54a0-6ead-4eb4-a306-011225cfd6c1',
  NULL,
  '660e8400-e29b-41d4-a716-446655440000', -- Örnek song ID
  25,
  'Bu şarkı favorim!',
  NOW() - INTERVAL '5 hours',
  NOW() - INTERVAL '5 hours'
),
(
  gen_random_uuid(),
  '846e54a0-6ead-4eb4-a306-011225cfd6c1',
  NULL,
  '660e8400-e29b-41d4-a716-446655440001', -- Örnek song ID
  150,
  'İnanılmaz!',
  NOW() - INTERVAL '1 week',
  NOW() - INTERVAL '1 week'
),
(
  gen_random_uuid(),
  '846e54a0-6ead-4eb4-a306-011225cfd6c1',
  NULL,
  '660e8400-e29b-41d4-a716-446655440002', -- Örnek song ID
  80,
  'Çok güzel!',
  NOW() - INTERVAL '2 weeks',
  NOW() - INTERVAL '2 weeks'
),
(
  gen_random_uuid(),
  '846e54a0-6ead-4eb4-a306-011225cfd6c1',
  '550e8400-e29b-41d4-a716-446655440003', -- Örnek artist ID
  NULL,
  200,
  'En sevdiğim sanatçı!',
  NOW() - INTERVAL '1 month',
  NOW() - INTERVAL '1 month'
),
(
  gen_random_uuid(),
  '846e54a0-6ead-4eb4-a306-011225cfd6c1',
  NULL,
  '660e8400-e29b-41d4-a716-446655440003', -- Örnek song ID
  30,
  'Bu şarkıyı çok seviyorum!',
  NOW() - INTERVAL '2 months',
  NOW() - INTERVAL '2 months'
);

-- 3. Oluşturulan verileri kontrol et
SELECT 
  id,
  from_user_id,
  to_artist_id,
  song_id,
  amount,
  message,
  created_at
FROM respect_transactions 
WHERE from_user_id = '846e54a0-6ead-4eb4-a306-011225cfd6c1'
ORDER BY created_at DESC;

-- 4. Toplam respect sayısını kontrol et
SELECT 
  COUNT(*) as total_transactions,
  SUM(amount) as total_amount
FROM respect_transactions 
WHERE from_user_id = '846e54a0-6ead-4eb4-a306-011225cfd6c1';
