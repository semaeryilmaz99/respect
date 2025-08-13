-- Add image_url column to songs table
-- Bu script songs tablosuna image_url kolonu ekler

-- 1. Songs tablosuna image_url kolonu ekle
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Mevcut cover_url verilerini image_url'e kopyala (eğer varsa)
UPDATE songs 
SET image_url = cover_url 
WHERE image_url IS NULL AND cover_url IS NOT NULL;

-- 3. Güncellenmiş yapıyı kontrol et
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'songs' 
  AND column_name IN ('image_url', 'cover_url')
ORDER BY ordinal_position;

-- 4. Örnek veri kontrol et
SELECT 
  id,
  title,
  cover_url,
  image_url
FROM songs 
LIMIT 5;
