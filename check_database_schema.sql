-- Check Database Schema for Missing Columns
-- Bu script eksik kolonları tespit eder ve ekler

-- 1. Artists tablosunun mevcut yapısını kontrol et
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'artists'
ORDER BY ordinal_position;

-- 2. Songs tablosunun mevcut yapısını kontrol et
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'songs'
ORDER BY ordinal_position;

-- 3. Eksik kolonları ekle (eğer yoksa)

-- Artists tablosuna image_url kolonu ekle
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artists' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE artists ADD COLUMN image_url TEXT;
    RAISE NOTICE 'image_url kolonu artists tablosuna eklendi';
  ELSE
    RAISE NOTICE 'image_url kolonu zaten mevcut';
  END IF;
END $$;

-- Songs tablosuna image_url kolonu ekle
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'songs' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE songs ADD COLUMN image_url TEXT;
    RAISE NOTICE 'image_url kolonu songs tablosuna eklendi';
  ELSE
    RAISE NOTICE 'image_url kolonu zaten mevcut';
  END IF;
END $$;

-- 4. Güncellenmiş yapıyı kontrol et
SELECT 'ARTISTS TABLE:' as table_info;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'artists'
ORDER BY ordinal_position;

SELECT 'SONGS TABLE:' as table_info;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'songs'
ORDER BY ordinal_position;
