-- Spotify connections tablosu için RLS politikasını düzelt
-- Bu script production Supabase'de çalıştırılmalı

-- 1. Mevcut RLS politikalarını kaldır
DROP POLICY IF EXISTS "Users can view their own spotify connections" ON spotify_connections;
DROP POLICY IF EXISTS "Users can insert their own spotify connections" ON spotify_connections;
DROP POLICY IF EXISTS "Users can update their own spotify connections" ON spotify_connections;
DROP POLICY IF EXISTS "Users can delete their own spotify connections" ON spotify_connections;

-- 2. Yeni RLS politikalarını oluştur
-- SELECT politikası - kullanıcılar kendi bağlantılarını görebilir
CREATE POLICY "Users can view their own spotify connections" ON spotify_connections
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT politikası - kullanıcılar kendi bağlantılarını ekleyebilir
CREATE POLICY "Users can insert their own spotify connections" ON spotify_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE politikası - kullanıcılar kendi bağlantılarını güncelleyebilir
CREATE POLICY "Users can update their own spotify connections" ON spotify_connections
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE politikası - kullanıcılar kendi bağlantılarını silebilir
CREATE POLICY "Users can delete their own spotify connections" ON spotify_connections
  FOR DELETE USING (auth.uid() = user_id);

-- 3. RLS'yi etkinleştir (eğer değilse)
ALTER TABLE spotify_connections ENABLE ROW LEVEL SECURITY;

-- 4. Test için geçici olarak RLS'yi devre dışı bırak (sadece geliştirme için)
-- ALTER TABLE spotify_connections DISABLE ROW LEVEL SECURITY;

-- 5. Mevcut verileri kontrol et
SELECT COUNT(*) as total_connections FROM spotify_connections;

-- 6. RLS politikalarını kontrol et
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'spotify_connections';
