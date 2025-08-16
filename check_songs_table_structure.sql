-- Check songs table structure
-- Bu dosya songs tablosunun mevcut yapısını kontrol etmek için kullanılır

-- Songs tablosunun mevcut kolonlarını listele
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'songs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Songs tablosundan örnek veri çek
SELECT * FROM songs LIMIT 3;

-- Tablo yapısını detaylı göster
\d songs;
